import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import crown from "../assets/crown.svg";
import { Button } from "./ui/button";

function TopResult({ result, rank }: { result: any; rank: number }) {
  return (
    <Card className="text-center relative">
      {rank === 1 && (
        <img
          src={crown}
          alt="Crown icon"
          className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12"
        />
      )}
      <CardHeader>
        <img
          src={result.image}
          alt={"Toyota " + result.model}
          className="w-full h-40 object-contain mb-4 rounded-md"
        />
        <CardTitle>{result.model}</CardTitle>
        <CardDescription className="text-sm text-gray-500 font-mono">
          Rank #{rank}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(() => {
          const raw = result?.summary ?? "";
          const cleaned = raw
            .replace(/\[\s*\d+(?:\s*(?:,|;|-|–)\s*\d+)*\s*\]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          const maxLen = 150;
          const display =
            cleaned.length > maxLen
              ? cleaned.slice(0, maxLen).trimEnd() + "…"
              : cleaned;

          // title shows full text on hover; className keeps spacing
          return (
            <CardDescription title={cleaned} className="whitespace-pre-wrap">
              {display}
            </CardDescription>
          );
        })()}
      </CardContent>
      <CardFooter className="justify-between items-center">
        <p className="font-bold text-lg">
          From{" "}
          {result.msrp
            ? result.msrp.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              })
            : ""}
        </p>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  );
}

export default TopResult;
