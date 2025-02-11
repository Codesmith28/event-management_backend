import { Request, Response } from "express";
import Event from "../models/Event";
import { getIO } from "../socket";
import { Types } from "mongoose";

export const createEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Only admins can create events" });
      return;
    }

    const { title, description, date, time, location, imageUrl, category } =
      req.body;

    // Validate required fields
    if (!title || !description || !date || !time || !location || !category) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      imageUrl,
      category,
      organizer: req.user.userId,
      seatsTotal: req.body.seatsTotal || 100, // Default value
      bookedSeats: 0,
    });

    await event.save();

    // Emit socket event
    getIO().emit("eventCreated", event);

    res.status(201).json(event);
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Only admins can update events" });
      return;
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const {
      title,
      description,
      date,
      time,
      location,
      imageUrl,
      category,
      seatsTotal
    } = req.body;

    // Update all fields if provided
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (time) event.time = time;
    if (location) event.location = location;
    if (imageUrl) event.imageUrl = imageUrl;
    if (category) event.category = category;
    if (seatsTotal && seatsTotal >= event.attendees.length) {
      event.seatsTotal = seatsTotal;
    }

    await event.save();

    // Populate organizer details before sending
    await event.populate("organizer", "name email");

    // Emit socket event with the updated event
    getIO().emit("eventUpdated", event);

    res.json(event);
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Only admins can delete events" });
      return;
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    await event.deleteOne();

    getIO().emit("eventDeleted", { id: req.params.id });

    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, startDate, endDate } = req.query;
    
    const query: any = {};

    // Title filter - case-insensitive partial match
    if (title) {
      query.title = { $regex: new RegExp(String(title), 'i') };
    }

    // Category filter - exact match
    if (category && category !== 'all') {
      query.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(String(startDate));
      }
      if (endDate) {
        const endDateTime = new Date(String(endDate));
        endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
        query.date.$lte = endDateTime;
      }
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('organizer', 'name email')
      .exec();

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email"
    );
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ...existing exports...

export const bookSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    if (event.bookedSeats >= event.seatsTotal) {
      res.status(400).json({ message: "No seats available" });
      return;
    }
    event.bookedSeats += 1;
    await event.save();

    // Broadcast the updated seat booking info
    getIO().emit("seatUpdated", {
      eventId: event._id,
      bookedSeats: event.bookedSeats,
      seatsAvailable: event.seatsTotal - event.bookedSeats,
    });

    res.status(200).json({ message: "Seat booked", event });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const bookEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Check if user already booked
    const isBooked = event.attendees
      .map((id) => id.toString())
      .includes(req.user.userId);
    if (isBooked) {
      res.status(400).json({ message: "Already booked this event" });
      return;
    }

    // Check if seats are available
    const currentAttendees = event.attendees.length;
    if (currentAttendees >= event.seatsTotal) {
      res.status(400).json({ message: "No seats available" });
      return;
    }

    // Add user to attendees
    event.attendees.push(new Types.ObjectId(req.user.userId));
    await event.save();

    // Calculate updated stats
    const totalAttendees = event.attendees.length;
    const seatsAvailable = event.seatsTotal - totalAttendees;

    // Emit socket event with updated stats
    getIO().emit("attendeeUpdate", {
      eventId: event._id,
      count: totalAttendees,
      seatsAvailable: seatsAvailable,
    });

    res.status(200).json({
      message: "Event booked successfully",
      attendees: totalAttendees,
      seatsAvailable: seatsAvailable,
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unbookEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      (id) => id.toString() !== req.user?.userId
    );
    await event.save();

    // Calculate updated stats
    const totalAttendees = event.attendees.length;
    const seatsAvailable = event.seatsTotal - totalAttendees;

    // Emit socket event
    getIO().emit("attendeeUpdate", {
      eventId: event._id,
      count: totalAttendees,
      seatsAvailable: seatsAvailable,
    });

    res.status(200).json({
      message: "Event unbooked successfully",
      attendees: totalAttendees,
      seatsAvailable: seatsAvailable,
    });
  } catch (error) {
    console.error("Unbooking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeAttendee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const userId = req.params.userId;
    event.attendees = event.attendees.filter(
      (id) => id.toString() !== userId
    );
    await event.save();

    // Emit socket event with updated stats
    getIO().emit("attendeeUpdate", {
      eventId: event._id,
      count: event.attendees.length,
      seatsAvailable: event.seatsTotal - event.attendees.length,
    });

    res.status(200).json({
      message: "Attendee removed successfully",
      attendees: event.attendees.length,
      seatsAvailable: event.seatsTotal - event.attendees.length,
    });
  } catch (error) {
    console.error("Remove attendee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
