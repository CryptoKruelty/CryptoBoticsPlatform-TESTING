import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    return next();
  }
  
  res.status(401).json({ message: "Authentication required" });
}

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  storage.getUser(req.session.userId).then(user => {
    if (user && user.isAdmin) {
      req.session.isAdmin = true;
      next();
    } else {
      res.status(403).json({ message: "Admin privileges required" });
    }
  }).catch(err => {
    console.error("Admin check error:", err);
    res.status(500).json({ message: "Internal server error" });
  });
}

export function ensureGuildAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const guildId = req.params.guildId || req.body.guildId;
  if (!guildId) {
    return res.status(400).json({ message: "Guild ID required" });
  }
  
  storage.getUser(req.session.userId).then(async user => {
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    try {
      // In a real implementation, this would check if the user is an admin of the specified guild
      // For this demo, we'll skip the actual Discord API call
      const isGuildAdmin = true; // Mock implementation
      
      if (isGuildAdmin) {
        next();
      } else {
        res.status(403).json({ message: "Guild admin privileges required" });
      }
    } catch (error) {
      console.error("Guild admin check error:", error);
      res.status(500).json({ message: "Failed to verify guild permissions" });
    }
  }).catch(err => {
    console.error("Guild admin check error:", err);
    res.status(500).json({ message: "Internal server error" });
  });
}
