import React, { useState, useEffect } from "react";
import './index.css';

// Login Component
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
    <form onSubmit={handleSubmit}>
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
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

// Dog Search Component
const DogSearch = () => {
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

  useEffect(() => {
    fetch("https://frontend-take-home-service.fetch.com/dogs/breeds", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setBreeds(data))
      .catch((error) => console.error("Error fetching breeds:", error));
  }, []);

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

// Update toggleSortOrder to only toggle the sort state
const toggleSortOrder = () => {
  setSort((prevSort) => (prevSort === "breed:asc" ? "breed:desc" : "breed:asc"));
};

// Use useEffect to call handleSearch when the sort state changes
useEffect(() => {
  if (dogs.length > 0) {
    handleSearch(1); // Re-fetch results when sort changes
  }
}, [sort]); // Only run when the sort state changes
  
  const handleFavorite = (dogId) => {
    setFavorites((prev) =>
      prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]
    );
  };

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
    } catch (error) {
      console.error("Error generating match:", error);
      alert("An error occurred while generating the match. Please try again later.");
    }
  };

  return (
    <div>
      <h1 className="center-items">Fetch Dog Search</h1>
      <div className="center-items">
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
        <input className="button-spacing"
          type="number"
          placeholder="Min Age"
          value={filters.ageMin}
          onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
        />
        <input className="button-spacing"
          type="number"
          placeholder="Max Age"
          value={filters.ageMax}
          onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
        />
        <input className="button-spacing"
          type="text"
          placeholder="Zip Codes"
          value={filters.zipCodes}
          onChange={(e) => setFilters({ ...filters, zipCodes: e.target.value })}
        />
        <button onClick={() => handleSearch(1)} className="button-spacing">Search</button>
        <button onClick={toggleSortOrder} className="button-spacing" disabled={dogs.length === 0}>
          Sort by Breed ({sort === "breed:desc" ? "Ascending" : "Descending"})
        </button>
      </div>
      <h2 className="center-items">Results</h2>
      <div className="dogs-container">
        {dogs.map((dog) => (
          <div key={dog.id} className="dog-card">
            <img src={dog.img} alt={dog.name} width="100" />
            <p>Name: {dog.name}</p>
            <p>Breed: {dog.breed}</p>
            <p>Age: {dog.age} years old</p>
            <p>Zip Code: {dog.zip_code}</p>
            <button onClick={() => handleFavorite(dog.id)}>
              {favorites.includes(dog.id) ? "Unfavorite" : "Favorite"}
            </button>
          </div>
      ))}
      </div>
      {/* Pagination Controls */}
      <div className="center-items">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span className="button-spacing">
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={handleNextPage} className="button-spacing" disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {/* Generate Match Button */}
      <div className="center-items" style={{ marginTop: "10px" }}>
        <button onClick={handleMatch}>Generate Match</button>
      </div>
      
      {/* Display Matched Dog */}
      {matchedDog && (
        <div>
          <h2>Your Match</h2>
          <img src={matchedDog.img} alt={matchedDog.name} width="100" />
          <p>Name: {matchedDog.name}</p>
          <p>Breed: {matchedDog.breed}</p>
          <p>Age: {matchedDog.age} years old</p>
          <p>Zip Code: {matchedDog.zip_code}</p>
        </div>
      )}
    </div>
  );
};

// App Component
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <div>
      {!isLoggedIn ? (
        <Login onLogin={() => setIsLoggedIn(true)} />
      ) : (
        <DogSearch />
      )}
    </div>
  );
};

export default App;