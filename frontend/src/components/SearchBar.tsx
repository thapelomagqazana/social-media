import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "../styles/SearchBar.css";

/**
 * @component SearchBar
 * @description A futuristic Glassmorphism-styled search bar for NeoSocial.
 * - Implements translucent UI with a neon glow effect.
 * - Enhances user experience with an intuitive placeholder & soft hover effect.
 */
const SearchBar: React.FC = () => {
  return (
    <TextField
      variant="outlined"
      placeholder="Search posts, users, hashtags..."
      fullWidth
      className="search-bar"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon className="search-icon" />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;
