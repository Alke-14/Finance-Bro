import React, { useEffect, useState } from "react";
import type { Result } from "../lib/types";
import { Link, useParams } from "react-router-dom";
import { FaGasPump, FaCar, FaThumbsUp } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";

function Car() {
  const { id } = useParams();

  const [car, setCar] = useState<Result | null>(null);
  const [reasons, setReasons] = useState<{
    summary: string;
    reasons: string[];
  } | null>(null);
  const [reasonsLoading, setReasonsLoading] = useState(false);

  // Fetch car details based on ID from params
  useEffect(() => {
    try {
      fetch(`http://localhost:3000/car/${id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched car data:", data);
          setCar(data.vehicle);
        })
        .catch((err) => {
          console.error("Error fetching car data:", err);
        });
    } catch (err) {
      console.error("Failed to retrieve car information:", err);
    }
  }, [id]);

  // Fetch reasons why this car was recommended
  useEffect(() => {
    const carvibeRecommendation = sessionStorage.getItem(
      "carvibe_recommendation"
    );
    if (!carvibeRecommendation) return;

    let userPrompt: string | undefined;
    try {
      const parsed = JSON.parse(carvibeRecommendation);
      userPrompt = parsed.prompt;
      console.log("User prompt from sessionStorage:", userPrompt);
    } catch (e) {
      console.error(
        "Failed to parse carvibe_recommendation from sessionStorage:",
        e
      );
      return;
    }
    if (!userPrompt) return;

    setReasonsLoading(true);
    fetch(`http://localhost:3000/recommend-reasons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userPrompt,
        vehicleId: id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setReasons(data);
      })
      .catch((err) => {
        console.error("Error fetching recommend reasons:", err);
      })
      .finally(() => setReasonsLoading(false));
  }, [id]);

  if (!car) {
    return <div>Loading car details...</div>;
  }

  return (
    <div className="container m-auto w-full mt-4 px-4">
      <div className="flex flex-col md:flex-row flex-wrap mb-6 w-full">
        <div className="image-wrapper  md:w-1/2 border-l-[12px] border-[#DF2502]">
          <img
            src={car.image}
            alt={car.model}
            className="mb-4 object-contain w-full h-auto"
          />
        </div>
        <div className="content w-full md:w-1/2">
          <h1 className="text-3xl font-bold mb-4">2026 Toyota {car.model}</h1>
          <p className="text-2xl font-semibold mb-4">
            {car.msrp
              ? car.msrp.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })
              : "N/A"}
          </p>
          <p>{car.summary}</p>
          {car.buildlink && (
            <div className="actions mt-4 flex gap-4">
              <Link
                to={car.buildlink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>Start Building</Button>
              </Link>
              <Button variant="outline">Contact Dealer</Button>
            </div>
          )}
        </div>
      </div>
      <hr className="my-6" />
      <div className="flex flex-col md:flex-row flex-wrap mb-6 w-full">
        <div className="specs w-full md:w-1/2 mt-2 md:mb-0">
          <h2 className="text-2xl font-bold mb-4">Specifications</h2>
          <ul className="list-disc list-inside">
            <li className="flex gap-2 text-center items-center">
              <FaCar /> <strong>Category:</strong> {car.segment || "N/A"}
            </li>
            <li className="flex gap-2 text-center items-center">
              <FaGasPump /> <strong>Gas Mileage or Range:</strong>{" "}
              {car.mpgOrRange || "N/A"}
            </li>
            <li className="flex gap-2 text-center items-center">
              <BsPeopleFill /> <strong>Number of Seats:</strong>{" "}
              {car.seats || "N/A"}
            </li>
            <h2 className="text-2xl font-bold mt-2">Features</h2>
            {car.features && car.features.length > 0 ? (
              <ul className="list-disc list-inside">
                {car.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            ) : (
              <p>No features listed.</p>
            )}
          </ul>
        </div>
        <div className="reasons w-full md:w-1/2 mt-2 md:mb-0">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaThumbsUp /> Why You'd Like This One
          </h2>
          <div>
            {reasonsLoading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <p>Loading reasons...</p>
              </div>
            ) : reasons ? (
              <>
                <p className="mb-2 font-semibold">{reasons.summary}</p>
                <ul className="list-inside">
                  {reasons.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 mb-1">
                      <span className="text-green-600 mt-1">
                        {/* Green checkmark SVG */}
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <circle cx="10" cy="10" r="10" fill="#22c55e" />
                          <path
                            d="M6 10.5l3 3 5-5"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No reasons available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Car;
