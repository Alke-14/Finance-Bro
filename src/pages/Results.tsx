import TopResult from "@/components/TopResult";
import React, { use, useState, useEffect } from "react";
import type { Result } from "../lib/types";

function Results() {
  const [results, setResults] = useState<Result[] | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("carvibe_recommendation");
      if (!raw) {
        window.location.href = "/form";
        return;
      }
      const parsed = JSON.parse(raw);
      const parsedResult = parsed?.result.results;
      if (!parsedResult) return;

      console.log("Parsed recommendation results:", parsedResult);

      // If parsedResult is already an array of Result, use it.
      if (Array.isArray(parsedResult)) {
        setResults(parsedResult);
        return;
      }

      // If parsedResult is an object with an items array, use that.
      if (parsedResult.items && Array.isArray(parsedResult.items)) {
        setResults(parsedResult.items);
        return;
      }
    } catch (err) {
      console.error("Failed to parse recommendation results:", err);
    }
  }, []);

  console.log("Results state:", results);

  return (
    <div className="container mx-auto px-4 mt-4">
      <h1 className="text-3xl font-bold mb-6">Your Top Results</h1>
      {!results ? (
        <p>No recommendation results available.</p>
      ) : (
        (() => {
          const topThree = results?.slice(0, 3);
          const rest = results?.slice(3);

          console.log("Top three results:", topThree);

          return (
            <>
              <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topThree?.map((item, idx) => (
                    <div key={item.id ?? `top-${idx}`} className="w-full">
                      <TopResult result={item} rank={idx + 1} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rest.map((item, idx) => (
                  <TopResult
                    key={item.id ?? `res-${idx + 3}`}
                    result={item}
                    rank={idx + 4}
                  />
                ))}
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}

export default Results;
