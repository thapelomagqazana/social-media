import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

// Initialize WebSocket connection
const socket = io("http://localhost:5000");

/**
 * @context WebSocketContext
 * @description Provides real-time updates for new posts.
 */
const WebSocketContext = createContext<{ newPost?: any }>({}); // ✅ Default value is an empty object

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [newPost, setNewPost] = useState<any>(null);

  useEffect(() => {
    socket.on("newPost", (post) => {
      console.log("Received new post via WebSocket:", post);
      setNewPost(post);
    });

    return () => {
      socket.off("newPost");
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ newPost }}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * @hook useWebSocket
 * @returns {Object} { newPost } - The latest received post.
 * @description Custom hook to access WebSocket updates.
 */
export const useWebSocket = () => useContext(WebSocketContext) ?? {}; // Return empty object if null
