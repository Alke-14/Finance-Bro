import React from "react";
import { Input } from "./components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import "./About.css";
import { Button } from "./components/ui/button";
import Background from "./components/Background";

const About: React.FC = () => {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const timeSpent = String(fd.get("timeSpent") || "").trim();
    const reaction = String(fd.get("reaction") || "").trim();
    const drivingType = String(fd.get("drivingType") || "").trim();
    const importantDetail = String(fd.get("importantDetail") || "").trim();
    const frequency = String(fd.get("frequency") || "").trim();
    const music = String(fd.get("music") || "").trim();
    const travel = String(fd.get("travel") || "").trim();

    // Natural language prompt assembled from form values
    const prompt = [
      `Weekends: ${timeSpent}.`,
      `Desired reaction to the car: ${reaction}.`,
      `Driving style: ${drivingType}.`,
      `Top priority when choosing: ${importantDetail}.`,
      `Driving frequency: ${frequency}.`,
      `Music they vibe with: ${music}.`,
      `Favorite travel location: ${travel}.`,
      "Return a concise list of 5 specific makes/models (recent model years), each with a one-sentence rationale, and finish with a short summary of the overall vibe.",
    ].join(" ");

    console.log("Generated prompt:", prompt);

    try {
      const res = await fetch("http://localhost:3000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });

      // If your service returns non-200 on error, surface it
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const result = await res.json();

      // Store prompt + results so a results page (if you build one) can read it
      const id =
        typeof crypto !== "undefined" &&
        typeof (crypto as any).randomUUID === "function"
          ? (crypto as any).randomUUID()
          : `id_${Date.now().toString(36)}_${Math.random()
              .toString(36)
              .slice(2)}`;

      sessionStorage.setItem(
        "carvibe_recommendation",
        JSON.stringify({ id, prompt, result, ts: Date.now() })
      );

      // Lightweight navigation without requiring a router.
      // Create a /results route/page that reads from sessionStorage key above.
      // if (window?.location) {
      //   window.location.assign("/results");
      // }
      console.log("Recommendation result:", result);
    } catch (err) {
      console.error("Recommendation request failed:", err);
      // Optional: show a toast or inline error UI here
      alert(
        "Sorry, something went wrong generating recommendations. Please try again."
      );
    }
  };

  return (
    <div className="bg-linear-to-t py-5 from-green-800 to-gray-800 flex items-center justify-center">
      <Background />
      <form
        onSubmit={handleSubmit}
        className="z-1 p-6 bg-[#ffffffc4] rounded-lg shadow-md backdrop-blur-sm"
      >
        <FieldGroup className="w-[400px]">
          <FieldSet>
            <FieldLegend>What's your Vibe?</FieldLegend>
            <FieldDescription>
              Let's find the right vehicle that matches your vibe
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="time-spent">
                  How do you spend your weekends?
                </FieldLabel>
                <Input
                  id="time-spent"
                  name="timeSpent"
                  placeholder="e.g. Relaxing at home"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="reaction">
                  What would you want people's reaction to be when they see your
                  car?
                </FieldLabel>
                <Input
                  id="reaction"
                  name="reaction"
                  placeholder="e.g. Amazed"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="driving-type">
                  What is your driving style?
                </FieldLabel>
                <Input
                  id="driving-type"
                  name="drivingType"
                  placeholder="e.g. Smooth and steady; I care about comfort"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="important-detail">
                  What matters the most to you when picking a car?
                </FieldLabel>
                <Input
                  id="important-detail"
                  name="importantDetail"
                  placeholder="e.g. Performance and power"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="frequency">
                  How often do you drive?
                </FieldLabel>
                <Input
                  id="frequency"
                  name="frequency"
                  placeholder="e.g. Every day for work"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="music">
                  What music do you vibe the most with?
                </FieldLabel>
                <Input
                  id="music"
                  name="music"
                  placeholder="e.g. Indie or acoustic"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="travel">
                  What location would be your favorite to travel to?
                </FieldLabel>
                <Input
                  id="travel"
                  name="travel"
                  placeholder="e.g. a mountain in the cabin"
                  required
                />
              </Field>
            </FieldGroup>

            <Button className="mt-4 w-full" type="submit">
              Find My CarVibe Match
            </Button>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  );
};

export default About;
