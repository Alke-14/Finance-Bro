import React from "react";
import Car_Green_SVG from "../assets/Car_Green_Front.svg";
import Car_Blue_SVG from "../assets/Car_Blue_Front.svg";
import pipe from "../assets/purzen-A-green-cartoon-pipe.svg";

function Background() {
  return (
    <>
      <img
        src={pipe}
        alt="Pipe"
        className="pipe w-100 h-100 absolute self-center left-0 rotate-90 z-1"
      />
      <div className="absolute flex flex-col left-1/2 transform -translate-x-1/2  border-gray-700 border-4 rounded-2xl bg-gray-600 h-[300px] justify-center items-center w-[65vw] opacity-80">
        <img
          src={Car_Green_SVG}
          alt="Car Vibes"
          className="car w-10 mb-1 translate-x-[-530px] mx-auto rotate-270"
        />
        <img
          src={Car_Blue_SVG}
          alt="Car Vibes"
          className="car w-10 mb-1 translate-x-[-430px] mx-auto rotate-270"
        />
        <img
          src={Car_Green_SVG}
          alt="Car Vibes"
          className="car w-10 mb-1 translate-x-[-550px] mx-auto rotate-270"
        />
      </div>
      <img
        src={pipe}
        alt="Pipe"
        className="pipe w-100 h-100 absolute self-center right-0 rotate-270 z-1"
      />
    </>
  );
}

export default Background;
