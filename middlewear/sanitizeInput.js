// server/middleware/sanitizeInput.js
import sanitizeHtml from "sanitize-html";

export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj) return;
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        // Sanitize string input to prevent XSS attacks
        obj[key] = sanitizeHtml(obj[key], {
          allowedTags: [], // Remove all HTML tags
          allowedAttributes: {}, // Remove all attributes
        });
      } else if (typeof obj[key] === "object") {
        // Recursively sanitize nested objects
        sanitizeObject(obj[key]);
      }
    }
  };

  // Sanitize request body, query, and parameters
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);

  next();
};

/*
You enhanced the security of your Express app by creating a custom sanitizer middleware using sanitize-html, 
which recursively cleans user inputs in req.body, req.query, and req.params to prevent XSS and injection attacks. 
This approach replaced express-mongo-sanitize, which caused issues with modern Express, ensuring 
compatibility and cleaner, safer input handling throughout your backend.
*/
