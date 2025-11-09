import express from "express";
import mongoose from "mongoose";
import { features } from "process";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
const app = express();
const port = process.env.PORT || 3000;
const { Schema, model } = mongoose;
const { GoogleGenAI } = await import("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export function cosineSimilarity(a, b) {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    a.length !== b.length
  ) {
    return NaN;
  }
  const dot = a.reduce((s, ai, i) => s + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (normA === 0 || normB === 0) return NaN;
  return dot / (normA * normB);
}

app.use(express.json());

const uri = process.env.MONGODB_URI || "";

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const connectDB = async () => {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB");
    // insertVehicleData();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

function prefilterByIntent(allDocs, query) {
  const q = (query || "").toLowerCase();

  // Examples – tweak as you like
  if (q.includes("family") || q.includes("kids") || q.includes("carpool")) {
    // prefer 3-row or minivan first, then other SUVs
    const threeRow = allDocs.filter(
      (d) => (d.seats || 0) >= 7 || /minivan/i.test(d.segment || "")
    );
    if (threeRow.length) return threeRow;
  }

  if (
    q.includes("long distance") ||
    q.includes("road trip") ||
    q.includes("highway")
  ) {
    // prefer comfy + efficient
    const comfy = allDocs.filter(
      (d) =>
        /grand highlander|highlander|sienna|crown|camry/i.test(d.model || "") ||
        /mid-size suv|full-size car|minivan/i.test(d.segment || "")
    );
    if (comfy.length) return comfy;
  }

  if (
    q.includes("sports") ||
    q.includes("track") ||
    q.includes("fun") ||
    q.includes("manual")
  ) {
    const sporty = allDocs.filter(
      (d) =>
        /gr|supra|gr86|gr corolla/i.test(d.model || "") ||
        /sports car/i.test(d.segment || "")
    );
    if (sporty.length) return sporty;
  }

  // fall back to everything
  return allDocs;
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/recommend", async (req, res) => {
  console.log("Received /recommend request with body:", req.body);
  const { query } = req.body;

  // first, try to get embedding for the query
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("Missing GOOGLE_API_KEY environment variable");
    }
    console.log("Embedding query:", query);
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: query,
      taskType: "SEMANTIC_SIMILARITY",
    });

    console.log("Embedding response:", response);

    let embedding =
      response?.embeddings?.[0]?.values ??
      response?.embeddings?.[0]?.embedding ??
      response?.embeddings?.[0] ??
      null;

    if (ArrayBuffer.isView(embedding)) embedding = Array.from(embedding);

    console.log(
      "Parsed embedding length:",
      Array.isArray(embedding) ? embedding.length : "null"
    );

    // then, fetch our db with embeddings and return the most similar vehicles
    await connectDB();
    const vehiclesColl = mongoose.connection.db.collection("vehicles");
    const docs = await vehiclesColl
      .find({ embedding: { $exists: true, $ne: null } })
      .toArray();

    const filteredDocs = prefilterByIntent(docs, query);

    console.log("Fetched vehicle documents:", filteredDocs.length);

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({ error: "Invalid query embedding" });
    }

    const qVec = embedding;
    const scored = [];

    for (const doc of docs) {
      const dVec = doc.embedding.values || doc.embedding;
      if (!Array.isArray(dVec) || dVec.length !== qVec.length) continue;
      const score = cosineSimilarity(qVec, dVec);
      console.log(`Doc ID: ${doc._id}, Score: ${score}`);
      if (!isFinite(score) || Number.isNaN(score)) continue;
      scored.push({ doc, score });
    }

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).map(({ doc, score }) => {
      const { embedding: _, ...rest } = doc;
      return { ...rest, score };
    });

    return res.json({ results: top3 });
  } catch (error) {
    console.error("Error embedding query:", error);
    return res.status(500).json({ error: "Failed to embed query" });
  }
});

// get top 3 most similar vehicles

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// connectDB()
//   .then(() => insertEmbeddings())
//   .catch((err) => {
//     console.error(err);
//   });

function insertEmbeddings() {
  (async () => {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY environment variable");
      }

      await connectDB();

      const vehiclesColl = mongoose.connection.db.collection("vehicles");
      const docs = await vehiclesColl.find({}).toArray();
      if (!docs.length) {
        console.log("No vehicle documents found.");
        return;
      }

      for (const doc of docs) {
        const textParts = [];

        // --- 1. Main Description ---
        // Creates a core paragraph: "The 2026 Corolla is a Compact Car..."
        const mainDesc = [
          "The",
          doc.year || "",
          doc.model || "",
          doc.segment ? `is a ${doc.segment}.` : "",
          doc.fuel ? `It is a ${doc.fuel} vehicle` : "",
          doc.mpgOrRange ? `that gets ${doc.mpgOrRange}.` : "",
          doc.seats ? `It seats ${doc.seats}.` : "",
          doc.msrp ? `It has a starting MSRP around $${doc.msrp}.` : "",
        ];
        textParts.push(mainDesc.filter(Boolean).join(" ").trim());

        // --- 2. Summary ---
        // Adds the detailed summary.
        if (doc.summary) {
          textParts.push(doc.summary);
        }

        // --- 3. Features ---
        // Creates a bulleted list of features.
        if (Array.isArray(doc.features) && doc.features.length) {
          const featureList = doc.features.join("\n- ");
          textParts.push(`Key features include:\n- ${featureList}`);
        }

        // --- 4. Target Demographic ---
        // Flattens the nested object into a descriptive paragraph.
        if (doc.target_demographic) {
          const demo = doc.target_demographic;
          const demoParts = [
            "This vehicle is primarily targeted at",
            demo.age_group ? `the ${demo.age_group} age group` : "",
            demo.income_range ? `with an income of ${demo.income_range}.` : "",
            demo.urbanicity
              ? `They typically live in ${demo.urbanicity} areas.`
              : "",
            demo.family_stage ? `Ideal for a ${demo.family_stage}.` : "",
            demo.purchase_motivation
              ? `Their main purchase motivations are ${demo.purchase_motivation.join(
                  " and "
                )}.`
              : "",
            demo.typical_uses
              ? `Typical uses include ${demo.typical_uses.join(", ")}.`
              : "",
            demo.tech_interest
              ? `They have a ${demo.tech_interest} interest in technology.`
              : "",
          ];
          textParts.push(demoParts.filter(Boolean).join(" ").trim());
        }

        // --- 5. Combine and Create Text ---
        // We join with a double newline for semantic separation.
        // This helps the model treat each section as a separate context block.
        const text = textParts.join("\n\n").trim();

        const response = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: text,
          taskType: "SEMANTIC_SIMILARITY", // <-- add this
        });

        const embedding =
          response?.embeddings?.[0]?.embedding ??
          response?.embeddings?.[0] ??
          null;

        if (!embedding) {
          console.warn(`No embedding returned for doc ${doc._id}`);
          continue;
        }

        await vehiclesColl.updateOne({ _id: doc._id }, { $set: { embedding } });

        console.log(`Saved embedding for document ${doc._id}`);
      }

      console.log("Finished inserting embeddings.");
    } catch (err) {
      console.error("insertEmbeddings error:", err);
    }
  })();
}

function insertVehicleData() {
  const vehicleSchema = new Schema(
    {
      model: { type: String, required: true },
      year: Number,
      msrp: Number,
      segment: String,
      seats: Number,
      fuel: { type: String, enum: ["Gasoline", "Electric", "Hybrid"] },
      mpgOrRange: String,
      features: [String],
      summary: String,
    },
    { collection: "vehicles" }
  );

  const Vehicle = model("vehicles", vehicleSchema);

  // const testData = new Vehicle({
  //   model: "Prius",
  //   year: 2026,
  //   msrp: 28550,
  //   segment: "Mid-size Car",
  //   seats: 5,
  //   fuel: "Hybrid",
  //   mpgOrRange: "Up to 57 Combined MPG",
  //   features: [
  //     "2.0L 4-Cylinder Hybrid engine ",
  //     "194 net combined horsepower (FWD) or 196 net combined horsepower (AWD) ",
  //     "Toyota Safety Sense™ (TSS 3.0) ",
  //     "Available 12.3-in. Toyota Audio Multimedia touchscreen [5]",
  //     "Available Electronic On-Demand All-Wheel Drive (AWD)",
  //     "Available Qi-compatible wireless smartphone charging [70]",
  //   ],
  //   summary:
  //     "The 2026 Toyota Prius [5] continues to define the hybrid segment as a mid-size liftback.[71] It features a sleek design, a 2.0L hybrid system producing up to 196 hp with available AWD , and a manufacturer-estimated 57 combined MPG. It comes standard with Toyota Safety Sense 3.0. 2026 MSRP is not yet announced; 2025 LE base MSRP is $28,550.[5]",
  // });

  // testData
  //   .save()
  //   .then(() => {
  //     console.log("Test vehicle data inserted successfully");
  //   })
  //   .catch((error) => {
  //     console.error("Error inserting test vehicle data:", error);
  //   });

  const vehiclesToInsert = [
    {
      model: "Corolla",
      year: 2026,
      msrp: 22725,
      segment: "Compact Car",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Up to 57 Combined MPG",
      features: [
        "Available as 2.0L 4-cylinder gas (169 hp) [87] or Hybrid powertrain [53, 88]",
        "Toyota Safety Sense 3.0 (TSS 3.0) [73]",
        "Standard 8-in. Toyota Audio Multimedia touchscreen [88]",
        "Available 12.3-in. digital gauge cluster (on XSE, Hybrid XLE) [88, 87]",
        "Standard Wireless Apple CarPlay® & Android Auto™ compatibility [88]",
        "Available Electronic On-Demand AWD (on Hybrid models) [88]",
        "Blind Spot Monitor (BSM) w/ Rear Cross-Traffic Alert (RCTA) now standard on all grades [87]",
      ],
      summary:
        "The 2026 Toyota Corolla [88] is a legendary compact car, available as a sedan or hatchback.[53, 89] It offers both a 169-hp 2.0L gas engine [87] and a highly efficient hybrid powertrain with available AWD.[88] For 2026, BSM with RCTA becomes standard, and XSE grades feature a 12.3-in. digital cluster.[87] All models come with TSS 3.0.[73] 2026 MSRP is not yet announced; 2025 LE base MSRP is $22,725.",
    },
    {
      model: "Land Cruiser",
      year: 2026,
      msrp: 57200,
      segment: "SUV",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Est. 23 Combined MPG",
      features: [
        "326 net combined horsepower [6]",
        "465 lb.-ft. of torque [5]",
        "Standard Full-Time 4-Wheel Drive [6]",
        "Standard Center and Rear Locking Differentials [5]",
        "Standard Crawl Control (CRAWL) and available Multi-Terrain Select (MTS) [6]",
        "Toyota Safety Sense 3.0 (TSS 3.0) Standard [5]",
        "Heritage-inspired rugged design with round LED headlights [5]",
        "Available 12.3-in. Toyota Audio Multimedia touchscreen [7]",
        "Available Head-Up Display [7]",
      ],
      summary:
        "The 2026 Land Cruiser [6, 7] returns to its rugged roots as a 5-seat, off-road focused SUV. It comes exclusively with a powerful i-FORCE MAX hybrid powertrain (326 hp, 465 lb.-ft.), full-time 4WD, and locking differentials.[5] It features heritage-inspired styling and modern tech like TSS 3.0, with a starting MSRP of $57,200.[5, 8]",
    },
    {
      model: "Highlander",
      year: 2026,
      msrp: 45270,
      segment: "Mid-size SUV",
      seats: 8,
      fuel: "Hybrid",
      mpgOrRange: "Est. 35 MPG Combined (Hybrid)",
      features: [
        "Standard All-Wheel Drive on all 2026 gas and hybrid grades [9]",
        "Standard three-row seating for up to seven, with optional bench seat for up to eight [9, 11]",
        "Toyota Safety Sense 2.5+ (TSS 2.5+) [9, 11]",
        "Available 12.3-in. Toyota Audio Multimedia touchscreen with 11 JBL® speakers [11]",
        "Available 12.3-in. digital gauge cluster [11]",
        "Available Panoramic Moonroof [9, 11]",
        "Up to 84.3 cubic feet of cargo capacity [9]",
      ],
      summary:
        "The 2026 Toyota Highlander [12, 13] is a versatile 3-row, mid-size SUV.[9] For 2026, All-Wheel Drive is now standard on all gas (265 hp) and hybrid (35 MPG est.) grades. It offers seating for up to eight, an available 12.3-in. multimedia screen, and comes standard with Toyota Safety Sense 2.5+.[9, 11] 2026 MSRP is not yet announced; 2025 Hybrid XLE base MSRP is $47,020.[11]",
    },
    {
      model: "4Runner",
      year: 2026,
      msrp: 41570,
      segment: "Mid-size SUV",
      seats: 7,
      fuel: "Hybrid",
      mpgOrRange: "Up to Est. 23 Combined MPG",
      features: [
        "All-new generation model [14]",
        "Standard i-FORCE 2.4L Turbo engine (278 hp, 317 lb.-ft.) [14]",
        "Available i-FORCE MAX Hybrid powertrain (326 hp, 465 lb.-ft.) [14, 15]",
        "Available 2WD, Part-Time 4WD or Full-Time 4WD [15]",
        "Standard Toyota Safety Sense 3.0 (TSS 3.0) on all models [14]",
        "Standard Power Rear Window with available Hands-Free Power Liftgate [14]",
        "Available Stabilizer Disconnect Mechanism (SDM) [14, 16]",
        "First-ever Trailhunter grade with Old Man Emu (OME) 2.5-inch shocks [14, 17]",
        "First-ever Platinum grade [14]",
        "TRD Pro grade with FOX® 2.5-in. Internal Bypass QS3 shocks [15, 16]",
        "Available 14-inch touchscreen display [14]",
      ],
      summary:
        "The 2026 Toyota 4Runner is a fully redesigned, all-new mid-size SUV.[14, 18] It moves to the TNGA-F body-on-frame platform, offering a standard 278-hp i-FORCE engine or a powerful 326-hp i-FORCE MAX hybrid.[15] It retains its iconic power rear window and adds new grades like the overlanding-focused Trailhunter and a luxury Platinum grade, all with standard TSS 3.0.[14, 17] Starting MSRP is $41,570.[14]",
    },
    {
      model: "RAV4",
      year: 2026,
      msrp: 29800,
      segment: "Compact SUV",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Est. 42 Combined MPG (HEV AWD)",
      features: [
        "All-new, redesigned 6th generation model [19]",
        "100% electrified lineup: available as Hybrid (HEV) or Plug-in Hybrid (PHEV) [19]",
        "5th Gen Toyota Hybrid System (HEV) with 226 hp (FWD) or 236 hp (AWD) [20, 19]",
        "First-ever RAV4 Hybrid with Front-Wheel Drive (FWD) [19]",
        "First-ever RAV4 GR SPORT model (PHEV) with GR-tuned handling [19]",
        "New Woodland grade (HEV or PHEV) with all-terrain tires and higher ride height [19, 21]",
        "Launches Toyota's Arene software development platform [19]",
        "Launches Toyota Safety Sense 4.0 (TSS 4.0) [19]",
        "New generation Toyota Audio Multimedia system with 10.5-in. or 12.9-in. touchscreen [19]",
        "Standard 12.3-inch digital gauge cluster [19]",
      ],
      summary:
        "The 2026 Toyota RAV4 [22, 21] is an all-new, 6th generation model that marks a major strategic shift.[19] It will be 100% electrified, available only as a Hybrid (HEV) or Plug-in Hybrid (PHEV). It debuts Toyota Safety Sense 4.0, the Arene OS, and introduces the first-ever RAV4 GR SPORT and a new Woodland grade.[19] Pricing will be announced closer to its Winter 2025 on-sale date.[19, 21]",
    },
    {
      model: "Tacoma",
      year: 2025,
      msrp: 31590,
      segment: "Mid-size Truck",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Up to Est. 24 Combined MPG",
      features: [
        "Available i-FORCE MAX Hybrid powertrain (326 hp, 465 lb.-ft.) [23, 24]",
        "Available 6-speed intelligent Manual Transmission (iMT) with rev matching [23, 24]",
        "Available 14-inch touchscreen display [23]",
        "TRD Pro grade with segment-first IsoDynamic Performance Front Seats and FOX® QS3 shocks [23, 16]",
        "Trailhunter grade with Old Man Emu® (OME) shocks and high-mount air intake [23]",
        "Available Stabilizer Disconnect Mechanism (SDM) [23]",
        "Standard Toyota Safety Sense 3.0 (TSS 3.0) [24]",
        "Fully redesigned coil spring multi-link rear suspension (available on most grades) [23]",
      ],
      summary:
        "The all-new 2025 Toyota Tacoma [23, 25] is a fourth-generation mid-size pickup on the TNGA-F platform. It offers a 6-speed manual or 8-speed auto [26], with a standard 2.4L turbo engine or the new 326-hp i-FORCE MAX hybrid.[24] It features new grades like Trailhunter and the high-tech TRD Pro with IsoDynamic seats.[16] Starting MSRP is $31,590.[23] 2026 model information is not yet available.",
    },
    {
      model: "Tundra",
      year: 2026,
      msrp: 40090,
      segment: "Full-size Truck",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Est. 22 Combined MPG",
      features: [
        "Available i-FORCE MAX® Hybrid powertrain (437 hp, 583 lb.-ft.) [27, 28]",
        "ISO Dynamic Seats now available on Tundra TRD Pro [27]",
        "32.2 Gallon Fuel Tank now standard on all grades [27]",
        "Maximum Towing Capacity of 12,000 lbs [27, 28]",
        "Available 14-in. Toyota Audio Multimedia Touchscreen [28]",
        "TRD Pro grade with FOX® shocks and 1.1-in. front lift [16]",
        "Toyota Safety Sense 2.5 (TSS 2.5) Standard on all grades [27]",
      ],
      summary:
        "The 2026 Toyota Tundra [29] is a full-size pickup offering both i-FORCE and the powerful 437-hp i-FORCE MAX hybrid powertrains.[28] For 2026, the TRD Pro model gets available ISO Dynamic seats (previously a Tacoma TRD Pro exclusive), and a larger 32.2-gallon fuel tank is now standard on all grades.[27] It features a 12,000-lb max towing capacity and standard TSS 2.5. 2026 MSRP is not yet announced.",
    },
    {
      model: "Sienna",
      year: 2026,
      msrp: 40120,
      segment: "Minivan",
      seats: 8,
      fuel: "Hybrid",
      mpgOrRange: "Up to Est. 36 Combined MPG",
      features: [
        "Available Electronic On-Demand All-Wheel Drive (AWD) [32]",
        "Standard Toyota Safety Sense 2.0 (TSS 2.0) [31]",
        "LE grade adds 8-speaker audio, power rear door, and moonroof as standard for 2026 [30, 31]",
        "XSE grade adds 12-speaker JBL® Premium Audio as standard for 2026 [30, 31]",
        "Available Hands-free dual power sliding side doors [32]",
        "Woodland Edition with increased ground clearance, AWD, and 3500-lb. tow hitch [32]",
      ],
      summary:
        "The 2026 Toyota Sienna [33, 34] remains a hybrid-exclusive minivan, delivering an estimated 36 combined MPG.[30, 32] For 2026, it receives significant standard feature upgrades, including an 8-speaker audio system and power moonroof on the base LE grade and a standard JBL audio system on the XSE.[31] It offers available AWD and TSS 2.0 standard. 2026 MSRP is not yet announced; 2025 XLE base MSRP is $44,820.[32]",
    },
    {
      model: "Camry",
      year: 2026,
      msrp: 29000,
      segment: "Mid-size Car",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Up to Est. 51 Combined MPG",
      features: [
        "All-new 9th generation model [35]",
        "Exclusively features 5th Gen Toyota Hybrid System [35]",
        "Up to 232 Net Combined Horsepower (AWD models) [36]",
        "Available Electronic On-Demand All-Wheel Drive (AWD) [35, 36]",
        "New Nightshade Edition with Midnight Black Metallic exterior cues for 2026 [35]",
        "Available 12.3-in. digital gauge cluster [37]",
        "Available 9-Speaker JBL® Premium Audio System [36]",
        "Standard Toyota Safety Sense 3.0",
      ],
      summary:
        "The 2026 Toyota Camry [36, 38, 39] is an all-new generation that moves to an exclusively hybrid-powered lineup, featuring the 5th-gen Toyota Hybrid System with up to 232 hp and available AWD.[35, 36] It achieves up to an estimated 51 combined MPG. For 2026, a new Nightshade Edition with unique 19-inch wheels and black styling is added to the lineup.[35] 2026 MSRP is not yet announced; 2025 SE base MSRP is $31,300.[36]",
    },
    {
      model: "Sequoia",
      year: 2026,
      msrp: 62425,
      segment: "Full-size SUV",
      seats: 8,
      fuel: "Hybrid",
      mpgOrRange: "Est. 22 Combined MPG",
      features: [
        "437 horsepower and 583 lb.-ft. of torque [22]",
        "TRD Pro grade with 18-in. BBS® forged-aluminum wheels [16]",
        "TRD Pro off-road suspension with 2.5-in. FOX® Internal Bypass coil-overs [16]",
        "Black 'TOYOTA' heritage grille with integrated LED light bar [16]",
        "Standard 3-row seating for up to 8 passengers",
        "Body-on-frame TNGA-F platform",
        "Up to 9,520-lb. maximum towing capacity",
      ],
      summary:
        "The 2026 Toyota Sequoia [40] is a 3-row, full-size SUV built on the same TNGA-F platform as the Tundra. It comes standard with the powerful i-FORCE MAX hybrid powertrain (437 hp, 583 lb.-ft.).[22] The 2026 lineup includes the high-performance TRD Pro, which features 18-in. BBS wheels and FOX® off-road shocks.[16] 2026 MSRP is not yet announced.",
    },
    {
      model: "GR Supra",
      year: 2026,
      msrp: 56250,
      segment: "Sports Car",
      seats: 2,
      fuel: "Gasoline",
      mpgOrRange: "Est. 26 Combined MPG",
      features: [
        "'MkV Final Edition' model for 2026 [41]",
        "3.0L In-line 6-cylinder turbocharged engine [41]",
        "382 horsepower and 368 lb.-ft. of torque [41, 42]",
        "Available 6-speed Manual Transmission or 8-speed Automatic Transmission [41, 42]",
        "Rear-Wheel Drive (RWD) platform [42]",
        "Improved braking performance and updated suspension for 2026 [41]",
        "Increased body rigidity and optimized tuning for 2026 [41]",
        "0-60 MPH in 3.9 seconds (AT) or 4.2 seconds (MT) [42]",
      ],
      summary:
        "The 2026 Toyota GR Supra [43, 44, 45] marks the 'MkV Final Edition' of the fifth-generation sports car.[41] It retains its 382-hp 3.0L turbo inline-6, RWD layout, and available 6-speed manual transmission. For 2026, it receives its final set of 'kaizen' or continuous improvements, including updated braking, a retuned suspension, and enhanced aerodynamic performance.[41] 2026 MSRP is not yet announced.",
    },
    {
      model: "Mirai",
      year: 2025,
      msrp: 51795,
      segment: "Mid-size Car",
      seats: 5,
      fuel: "Electric",
      mpgOrRange: "Up to Est. 402-Mile Driving Range",
      features: [
        "Fuel Cell Electric Vehicle (FCEV) - a 'plug-less' electric vehicle [46]",
        "Generates electricity from hydrogen and oxygen [47, 46]",
        "Built on premium Rear-Wheel Drive (RWD) GA-L platform [46]",
        "Near 50:50 weight distribution and low center of gravity [48]",
        "Toyota Safety Sense 3.0 (TSS 3.0) [46]",
        "Standard Toyota Audio Multimedia system [46]",
        "Purchase includes $15,000 or 6 years of complimentary hydrogen fuel [49]",
        "Lease includes $15,000 or 3 years of complimentary hydrogen fuel [49]",
      ],
      summary:
        "The 2025 Toyota Mirai [50, 47] is a flagship mid-size luxury sedan [46] and a 'plug-less' electric vehicle that runs on hydrogen (FCEV). It offers a 402-mile estimated range [49] and comes with $15,000 of complimentary fuel. For 2025, it features TSS 3.0 and the Toyota Audio Multimedia system on a premium RWD platform.[46] 2026 model information is not yet available.",
    },
    {
      model: "RAV4 Prime (PHEV)",
      year: 2026,
      msrp: 32850,
      segment: "Compact SUV",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Est. 50-Mile All-Electric Range",
      features: [
        "All-new 6th generation PHEV powertrain [19]",
        "Up to 320 horsepower output [19]",
        "Standard All-Wheel Drive (AWD)",
        "20% increase in all-electric range, now manufacturer-estimated 50 miles [19]",
        "Launches Toyota Safety Sense 4.0 (TSS 4.0) [19]",
        "Available as first-ever RAV4 GR SPORT (PHEV) with GR-tuned handling [19]",
        "Available DC Fast Charging capability (on XSE, Woodland) [20, 19]",
        "Available 11-kW Onboard AC Charger [20]",
      ],
      summary:
        "The 2026 RAV4 Prime [22, 54] is the all-new, 6th generation plug-in hybrid (PHEV) version of the RAV4.[19] It is the high-performance option in the 100% electrified 2026 RAV4 lineup, offering up to 320 hp and an increased 50-mile all-electric range.[19] It debuts TSS 4.0 and will be available as the first-ever RAV4 GR SPORT.[19] Pricing will be announced closer to its Spring 2026 on-sale date.[19, 22]",
    },
    {
      model: "Corolla Cross",
      year: 2026,
      msrp: 24935,
      segment: "Compact SUV",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Est. 41 Combined MPG",
      features: [
        "Available as 2.0L Gas or 2.0L Hybrid [55, 56]",
        "Hybrid powertrain produces a combined 196 horsepower [57]",
        "Standard Electronic On-Demand AWD (on all Hybrid models) [55]",
        "Toyota Safety Sense 3.0 (TSS 3.0) standard on all grades [55, 56]",
        "Standard 8-in. Toyota Audio Multimedia touchscreen [55]",
        "Standard Wireless Apple CarPlay® and Android Auto™ compatibility [55]",
        "Standard 7-in. digital gauge cluster [55]",
        "Standard Rear HVAC Vents [55]",
      ],
      summary:
        "The 2026 Toyota Corolla Cross [58] is a versatile compact crossover that bridges the gap between the C-HR and RAV4. It is available as a 2.0L gas model or a 196-hp 5th-gen hybrid.[55, 57] Hybrid models feature standard AWD. All 2026 models come with Toyota Safety Sense 3.0 and wireless Apple CarPlay®/Android Auto™.[55, 56] 2026 MSRP is not yet announced.",
    },
    {
      model: "GR86",
      year: 2026,
      msrp: 30800,
      segment: "Sports Car",
      seats: 4,
      fuel: "Gasoline",
      mpgOrRange: "Est. 20/26 MPG (MT)",
      features: [
        "2.4L 4-Cylinder naturally aspirated boxer engine [60]",
        "228 horsepower and 184 lb.-ft. of torque [60]",
        "0-60 MPH in 6.1 seconds (Manual Transmission) [60, 61]",
        "Available 6-Speed Manual or 6-Speed Automatic Transmission [60]",
        "Standard Rear-Wheel Drive (RWD) [60]",
        "7-in. Thin-Film Transistor (TFT) GR digital gauge cluster [60]",
        "Complimentary 1-year NASA membership, including one free High-Performance Driving Experience (HPDE) [62, 60]",
      ],
      summary:
        "The 2026 Toyota GR86 [63] is a pure, 2+2 RWD sports car [60] and a key model in the Gazoo Racing [62] lineup. It is powered by a 228-hp 2.4L boxer engine with an available 6-speed manual. For 2026, Toyota introduces the 'Yuzu Edition,' a special model with exclusive Yuzu Yellow paint, black wheels, and a performance package.[59] The 2026 GR86 starts at $30,800.[63]",
    },
    {
      model: "bZ",
      year: 2026,
      msrp: 34900,
      segment: "SUV",
      seats: 5,
      fuel: "Electric",
      mpgOrRange: "Up to Est. 314-Mile All-Electric Driving Range",
      features: [
        "Larger lithium-ion battery with up to 74.7-kWh total capacity [64]",
        "New XLE Front-Wheel-Drive Plus (FWD Plus) model with est. 314-mile range [65]",
        "AWD models with 338 combined system net hp [65]",
        "0-60 mph in 4.9 seconds (AWD models) [65]",
        "Adopts North American Charging System (NACS) port [65]",
        "DC Fast Charging (10-80% in approx. 30 minutes in ideal conditions) [65]",
        "Toyota Safety Sense™ (TSS 3.0) [66]",
        "Available Lane Change Assist, Traffic Jam Assist, and Advanced Park [67]",
      ],
      summary:
        "For 2026, the Toyota bZ4X [22] is rebranded as the 'Toyota bZ'.[64, 68] It receives significant upgrades, including a larger battery (up to 74.7-kWh), a new NACS port for charging, and a new FWD Plus model with an estimated 314-mile range. AWD models now produce 338 hp with a 0-60 time of 4.9 seconds.[65] 2026 MSRP is not yet announced.",
    },
    {
      model: "Crown",
      year: 2026,
      msrp: 41440,
      segment: "Full-size Car",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Up to Est. 41 MPG Combined",
      features: [
        "Hybrid MAX 2.4L Turbo Hybrid engine produces 340 hp and 400 lb-ft. of torque [69, 70]",
        "Toyota Hybrid System (THS) 2.5L engine achieves an EPA-estimated 41 MPG Combined Rating [69]",
        "Standard All-Wheel Drive (AWD) on all grades [71, 70]",
        "Unique coupe-like roofline with higher ride height [69]",
        "Standard Toyota Safety Sense 3.0 (TSS 3.0) [69]",
        "Available fixed panoramic roof [69]",
        "Available 11-speaker JBL® Premium Audio system [69]",
        "Available Advanced Technology package with Panoramic View Monitor and Digital Key [69]",
      ],
      summary:
        "The 2026 Toyota Crown [71, 69, 72] is a unique full-size car [4] that blends sedan and crossover styling with a raised ride height. It comes standard with AWD and two hybrid options: the efficient Toyota Hybrid System (41 MPG est.) or the powerful 340-hp Hybrid MAX.[69] It features TSS 3.0 and a premium cabin. 2026 MSRP is not yet announced.",
    },
    {
      model: "GR Corolla",
      year: 2026,
      msrp: 39920,
      segment: "Compact Car",
      seats: 5,
      fuel: "Gasoline",
      mpgOrRange: "Est. 21/28 MPG (City/Hwy)",
      features: [
        "1.6L 3-cylinder turbocharged engine [73]",
        "300 horsepower [74]",
        "Available 8-Speed Automatic or 6-Speed Manual Transmission [74]",
        "Standard GR-FOUR All-Wheel Drive (AWD) system [74]",
        "New structural enhancements improve body rigidity for 2026 [73]",
        "New secondary air intake improves engine temperature control for 2026 [73]",
        "Toyota Safety Sense 3.0 (TSS 3.0) standard [73]",
        "Available forged carbon-fiber roof (Premium Plus grade) [74, 75]",
        "Complimentary 1-year NASA membership [62, 74]",
      ],
      summary:
        "The 2026 Toyota GR Corolla [74, 76] is a rally-bred, 300-hp [74] hot hatch from Gazoo Racing.[62] It features a 1.6L 3-cylinder turbo, GR-FOUR AWD, and an available 6-speed manual or new 8-speed automatic. For 2026, it receives new structural enhancements and a new air intake for improved performance [73], with a starting MSRP of $39,920.[73]",
    },
    {
      model: "Grand Highlander",
      year: 2026,
      msrp: 41360,
      segment: "Mid-size SUV",
      seats: 8,
      fuel: "Hybrid",
      mpgOrRange: "Up to Est. 34 Combined MPG",
      features: [
        "Adult-sized third-row seating [77]",
        "Large rear cargo area with 97.5 cu. ft. of space (with seats down) [77]",
        "Three powertrain choices: 2.4L Turbo Gas, 2.5L Hybrid, and 2.4L Turbo Hybrid MAX [77, 78]",
        "Hybrid MAX powertrain delivers 362 horsepower [77, 78]",
        "2.5L Hybrid powertrain delivers a manufacturer-estimated 34 combined MPG [78]",
        "Available All-Wheel Drive [77]",
        "Toyota Safety Sense 3.0 (TSS 3.0) Standard [77]",
        "Available tech includes Traffic Jam Assist, Head-Up Display, and Digital Rearview Mirror [77]",
        "Seating for 7 (with 2nd Row Captain's Chairs) or 8 (with 2nd Row Bench) [77]",
      ],
      summary:
        "The 2026 Toyota Grand Highlander [77, 79] is a 3-row mid-size SUV focused on maximum interior space, offering an adult-sized third row and 97.5 cu. ft. of cargo.[77] It offers three powertrains, including an efficient 34-MPG 2.5L hybrid and a powerful 362-hp Hybrid MAX. TSS 3.0 is standard.[77, 78] 2026 MSRP is not yet announced.",
    },
    {
      model: "Crown Signia",
      year: 2026,
      msrp: 44090,
      segment: "SUV",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Up to 38 Combined Est. MPG",
      features: [
        "240 net combined horsepower [80]",
        "Standard Electronic On-Demand All-Wheel Drive (AWD) [82, 80]",
        "New Two-Tone exterior paint (black roof) available on Limited grade for 2026 [81]",
        "Up to 68.8 Cu. Ft. cargo capacity (with second-row seats flat) [80]",
        "Standard leather-trimmed seating and soft-touch materials [81]",
        "Available panoramic fixed-glass roof with power sunshade [80, 81]",
        "Toyota Safety Sense 3.0 (TSS 3.0) standard [81]",
        "Up to 2700 lbs. towing capacity [80]",
      ],
      summary:
        "The 2026 Toyota Crown Signia [82, 83] is a premium 5-seat hybrid crossover [81], serving as the strategic replacement for the discontinued Venza.[84] It comes standard with a 240-hp hybrid system, AWD, and achieves an estimated 38 combined MPG.[80] For 2026, it adds new two-tone paint options for the Limited grade.[81] 2026 MSRP is not yet announced; 2025 Limited base MSRP is $48,490.[80]",
    },
    {
      model: "Prius",
      year: 2026,
      msrp: 28550,
      segment: "Mid-size Car",
      seats: 5,
      fuel: "Hybrid",
      mpgOrRange: "Up to 57 Combined MPG",
      features: [
        "2.0L 4-Cylinder Hybrid engine ",
        "194 net combined horsepower (FWD) or 196 net combined horsepower (AWD) ",
        "Toyota Safety Sense™ (TSS 3.0) ",
        "Available 12.3-in. Toyota Audio Multimedia touchscreen [5]",
        "Available Electronic On-Demand All-Wheel Drive (AWD)",
        "Available Qi-compatible wireless smartphone charging [70]",
      ],
      summary:
        "The 2026 Toyota Prius [5] continues to define the hybrid segment as a mid-size liftback.[71] It features a sleek design, a 2.0L hybrid system producing up to 196 hp with available AWD , and a manufacturer-estimated 57 combined MPG. It comes standard with Toyota Safety Sense 3.0. 2026 MSRP is not yet announced; 2025 LE base MSRP is $28,550.[5]",
    },
  ];

  const bulkOps = vehiclesToInsert.map((v) => ({
    updateOne: {
      filter: { model: v.model, year: v.year },
      update: { $set: v },
      upsert: true,
    },
  }));

  Vehicle.bulkWrite(bulkOps)
    .then((result) => {
      const upserts = result.upsertedCount || 0;
      const modified = result.modifiedCount || 0;
      console.log(
        `Vehicles inserted/updated. Upserted: ${upserts}, Modified: ${modified}`
      );
    })
    .catch((err) => {
      console.error("Error inserting/updating vehicles:", err);
    });
  //   }
  // ];
}
