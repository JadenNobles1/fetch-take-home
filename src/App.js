import React, { useState, useEffect, useRef } from "react";
import './index.css';

// Login
const Login = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      const response = await fetch(
        "https://frontend-take-home-service.fetch.com/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
          credentials: "include",
        }
      );
      if (response.ok) {
        onLogin();
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="page-container">
      {/* Logo and Heading */}
      <header style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>

      {/* Logo */}
      <img
        src="https://cdn.brandfetch.io/id7Cm60rQf/theme/dark/idaA507RHz.svg?c=1bx1740417582576id64Mup7ac7BMUaS6m&t=1675057844666"
        alt="Fetch Rewards Logo"
        className="logo"
      />

        {/* Heading */}
        <h1 style={{ margin: 0 }}>Fetch Take Home Login</h1>
        </header>      
        <form onSubmit={handleSubmit} className="form-row">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Login</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

// Dog Search Component
const DogSearch = ({ onLogout }) => {
  const [breeds, setBreeds] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    breed: "",
    ageMin: "",
    ageMax: "",
    zipCodes: "",
  });
  const [sort, setSort] = useState("breed:asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [matchedDog, setMatchedDog] = useState(null); // Store matched dog
  const pageSize = 10; // Number of dogs per page

  // Reference to the matched dog section
  const matchRef = useRef(null);

  useEffect(() => {
    fetch("https://frontend-take-home-service.fetch.com/dogs/breeds", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setBreeds(data))
      .catch((error) => console.error("Error fetching breeds:", error));
  }, []);

  // Handle Search
  const handleSearch = async (page = 1) => {
    try {
      const formattedFilters = {
        ...filters,
        breeds: filters.breed ? [filters.breed] : [],
        zipCodes: filters.zipCodes
          ? filters.zipCodes.split(",").filter((zip) => zip.trim() !== "")
          : [],
      };
      const cleanedFilters = Object.fromEntries(
        Object.entries(formattedFilters).filter(([_, value]) => value.length > 0)
      );
      const queryParams = new URLSearchParams({
        ...cleanedFilters,
        sort,
        size: pageSize, // Number of results per page
        from: (page - 1) * pageSize, // Offset
      });
      if (cleanedFilters.zipCodes) {
        cleanedFilters.zipCodes.forEach((zip) =>
          queryParams.append("zipCodes", zip)
        );
      }
      const response = await fetch(
        `https://frontend-take-home-service.fetch.com/dogs/search?${queryParams}`,
        { credentials: "include" }
      );
      const data = await response.json();
      const dogIds = data.resultIds;
      setTotalPages(Math.ceil(data.total / pageSize)); // Set total pages
      const dogDetailsResponse = await fetch(
        "https://frontend-take-home-service.fetch.com/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dogIds),
          credentials: "include",
        }
      );
      const dogDetails = await dogDetailsResponse.json();
      setDogs(dogDetails);
      setCurrentPage(page); // Update current page
    } catch (error) {
      console.error("Error searching dogs:", error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handleSearch(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleSearch(currentPage - 1);
    }
  };

  const toggleSortOrder = () => {
    setSort((prevSort) => (prevSort === "breed:asc" ? "breed:desc" : "breed:asc"));
  };

  useEffect(() => {
    if (dogs.length > 0) {
      handleSearch(1); // Re-fetch results when sort changes
    }
  }, [sort]);

  // Handle Favorite
  const handleFavorite = (dogId) => {
    setFavorites((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  };

  // Handle Match
  const handleMatch = async () => {
    if (favorites.length === 0) {
      alert("Please add at least one dog to your favorites before generating a match.");
      return;
    }

    try {
      const response = await fetch(
        "https://frontend-take-home-service.fetch.com/dogs/match",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(favorites),
          credentials: "include",
        }
      );
      const data = await response.json();
      const matchedDogId = data.match;

      // Fetch details of the matched dog
      const matchedDogResponse = await fetch(
        "https://frontend-take-home-service.fetch.com/dogs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([matchedDogId]),
          credentials: "include",
        }
      );
      const matchedDogDetails = await matchedDogResponse.json();
      setMatchedDog(matchedDogDetails[0]);

      // Scroll to the matched dog section after a short delay
      setTimeout(() => {
        if (matchRef.current) {
          matchRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Error generating match:", error);
      alert("An error occurred while generating the match. Please try again later.");
    }
  };

  return (
    <div className="page-container">
      {/* Logo and Heading */}
      <header style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <img
          src="https://cdn.brandfetch.io/id7Cm60rQf/theme/dark/idaA507RHz.svg?c=1bx1740417582576id64Mup7ac7BMUaS6m&t=1675057844666"
          alt="Fetch Rewards Logo"
          className="logo"
        />
        <h1 style={{ margin: 0 }}>Fetch Dog Search</h1>
        <button onClick={onLogout} style={{ marginLeft: "auto" }} className="button-spacing">
          Logout
        </button>
      </header>

      {/* Filters */}
      <div className="form-row">
        <select
          value={filters.breed}
          onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
        >
          <option value="">Select Breed</option>
          {breeds.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Age"
          value={filters.ageMin}
          onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max Age"
          value={filters.ageMax}
          onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
        />
        <input
          type="text"
          placeholder="Zip Codes"
          value={filters.zipCodes}
          onChange={(e) => setFilters({ ...filters, zipCodes: e.target.value })}
        />
        <button onClick={() => handleSearch(1)} className="button-spacing">
          Search
        </button>
        <button onClick={toggleSortOrder} className="button-spacing">
          Sort by Breed ({sort === "breed:asc" ? "Ascending" : "Descending"})
        </button>
      </div>

      {/* Results */}
      <h2>Results</h2>
      <div className="dogs-container">
        {dogs.map((dog) => (
          <div key={dog.id} className="dog-card">
            <div style={{ display: "flex", justifyContent: "center"}}>
              <img src={dog.img} alt={dog.name} />
            </div>
            <div style={{justifyContent: "left"}}>
              <p><strong>Name:</strong> {dog.name}</p>
              <p><strong>Breed:</strong> {dog.breed}</p>
              <p><strong>Age:</strong> {dog.age} years old</p>
              <p><strong>Zip Code:</strong> {dog.zip_code}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center"}}>
              <button onClick={() => handleFavorite(dog.id)}>
                {favorites.includes(dog.id) ? "Unfavorite" : "Favorite"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button onClick={handlePrevPage} className="button-spacing" disabled={currentPage === 1}>
          Previous
        </button>
        <span className="button-spacing" >
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={handleNextPage} className="button-spacing"  disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {/* Generate Match Button */}
      <button onClick={handleMatch} style={{marginTop: "10px"}}>
        Generate Match
      </button>

      {/* Matched Dog Section */}
      <div ref={matchRef}>
        {matchedDog && (
          <div className="matched-dog">
            <h2>Your Match</h2>
            <img src={matchedDog.img} alt={matchedDog.name} />
            <p><strong>Name:</strong> {matchedDog.name}</p>
            <p><strong>Breed:</strong> {matchedDog.breed}</p>
            <p><strong>Age:</strong> {matchedDog.age} years old</p>
            <p><strong>Zip Code:</strong> {matchedDog.zip_code}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// App Component
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Handle Logout
  const handleLogout = async () => {
    try {
      // Call the logout endpoint
      await fetch("https://frontend-take-home-service.fetch.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Update the app state to log the user out
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error during logout:", error);
      alert("An error occurred while logging out. Please try again later.");
    }
  };

  return (
    <div>
      {!isLoggedIn ? (
        <Login onLogin={() => setIsLoggedIn(true)} />
      ) : (
        <DogSearch onLogout={handleLogout} />
      )}
    </div>
  );
};
export default App;