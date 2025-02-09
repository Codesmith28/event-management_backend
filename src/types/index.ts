export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  _id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl: string;
  category: string;
  organizer: IUser | string;
  attendees: (IUser | string)[];
  seatsTotal: number;
  bookedSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

// Module augmentation below...
declare global {
  namespace Express {
    interface Request {
      user?: {
        role: string;
        userId: string;
      };
    }
  }
}

export {}; // Ensure this file is a module
