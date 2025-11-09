import React, { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

function Search() {
  const [query, setQuery] = useState("");

  const vibes = [
    "I'm a young college student who needs a point A to B car",
    "I'm a busy parent looking for a reliable family vehicle",
    "I'm a recent retiree interested in comfort and safety",
    "I'm an adventurous traveler who loves road trips",
    "I'm a tech enthusiast who wants the latest features",
    "I'm an eco-conscious driver seeking a hybrid or electric car",
    "I'm a first-time car buyer on a tight budget",
    "I'm a luxury car lover who values style and prestige",
    "I'm a city dweller who needs something compact and easy to park",
    "I'm a weekend warrior who needs space for outdoor gear",
  ];

  const vibe = vibes[Math.floor(Math.random() * vibes.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const result = await res.json();

      const id =
        typeof crypto !== "undefined" &&
        typeof (crypto as any).randomUUID === "function"
          ? (crypto as any).randomUUID()
          : `id_${Date.now().toString(36)}_${Math.random()
              .toString(36)
              .slice(2)}`;

      sessionStorage.setItem(
        "carvibe_recommendation",
        JSON.stringify({
          id,
          prompt: query,
          result,
          answers: null,
          ts: Date.now(),
        })
      );

      window.location.href = "/results";
    } catch (err) {
      console.error("Recommendation request failed:", err);
      alert(
        "Sorry, something went wrong generating recommendations. Please try again."
      );
    }
  };

  return (
    <div className=" mx-auto p-4 bg-[#ffffffcf] rounded-2xl border border-gray-300">
      <form onSubmit={handleSubmit}>
        <Label
          htmlFor="search-input"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          What vibes do you bring?{" "}
        </Label>
        <div className="flex gap-2 justify-center items-center">
          <Input
            id="search-input"
            placeholder={vibe}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button className="w-24" type="submit">
            Search
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Search;
