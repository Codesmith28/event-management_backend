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
    const { title, description, date, location, imageUrl, category } = req.body;
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.imageUrl = imageUrl || event.imageUrl;
    event.category = category || event.category;

    await event.save();

    getIO().emit("eventUpdated", event);

    res.json(event);
  } catch (error) {
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
    const events = await Event.find().populate("organizer", "name email");
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    // Add user to attendees
    event.attendees.push(new Types.ObjectId(req.user.userId));
    await event.save();

    // Calculate updated stats using aggregation
    const stats = await Event.aggregate([
      { $match: { _id: new Types.ObjectId(req.params.id) } },
      {
        $project: {
          totalAttendees: { $size: "$attendees" },
          seatsAvailable: {
            $subtract: ["$seatsTotal", { $size: "$attendees" }],
          },
        },
      },
    ]);

    // Emit socket event with updated stats
    getIO().emit("attendeeUpdate", {
      eventId: event._id,
      count: stats[0].totalAttendees,
      seatsAvailable: stats[0].seatsAvailable,
    });

    res.status(200).json({
      message: "Event booked successfully",
      attendees: stats[0].totalAttendees,
      seatsAvailable: stats[0].seatsAvailable,
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
    const stats = await Event.aggregate([
      { $match: { _id: new Types.ObjectId(req.params.id) } },
      {
        $project: {
          totalAttendees: { $size: "$attendees" },
          seatsAvailable: {
            $subtract: ["$seatsTotal", { $size: "$attendees" }],
          },
        },
      },
    ]);

    // Emit socket event
    getIO().emit("attendeeUpdate", {
      eventId: event._id,
      count: stats[0].totalAttendees,
      seatsAvailable: stats[0].seatsAvailable,
    });

    res.status(200).json({
      message: "Event unbooked successfully",
      attendees: stats[0].totalAttendees,
      seatsAvailable: stats[0].seatsAvailable,
    });
  } catch (error) {
    console.error("Unbooking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
