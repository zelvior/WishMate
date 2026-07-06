import { jsPDF } from "jspdf";
import { BirthdayWishConfig } from "../types";

export function generateBirthdayPDF(config: BirthdayWishConfig) {
  // Create PDF instance (A4 size: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const { name, message, creatorName, relation, cakeType, theme, customTitle, recipientPhoto } = config;
  const titleText = customTitle || "Happy Birthday";
  const fromText = `From your ${relation || "Friend"} ${creatorName ? ", " + creatorName : ""}`;

  // Theme configuration colors and styles
  let bgColor: [number, number, number] = [255, 255, 255];
  let primaryTextColor: [number, number, number] = [15, 23, 42];
  let accentColor: [number, number, number] = [236, 72, 153];
  let cardBgColor: [number, number, number] = [248, 250, 252];
  let fontStyle = "helvetica";

  if (theme === "cosmic") {
    bgColor = [13, 11, 41]; // deep space dark navy
    primaryTextColor = [255, 255, 255];
    accentColor = [34, 211, 238]; // glowing cyan
    cardBgColor = [22, 21, 62]; // lighter dark-indigo card
  } else if (theme === "neon") {
    bgColor = [10, 10, 12]; // deep cyberpunk black
    primaryTextColor = [255, 255, 255];
    accentColor = [244, 63, 94]; // neon rose / pink
    cardBgColor = [24, 24, 27]; // dark card
  } else if (theme === "rose_gold") {
    bgColor = [253, 251, 247]; // warm champagne off-white
    primaryTextColor = [44, 30, 25]; // elegant deep mahogany
    accentColor = [197, 160, 89]; // luxury gold / rose metallic
    cardBgColor = [255, 255, 255]; // white card
  } else {
    // playful
    bgColor = [255, 244, 204]; // bright pale yellow
    primaryTextColor = [15, 23, 42];
    accentColor = [16, 185, 129]; // playful mint/emerald
    cardBgColor = [255, 255, 255];
  }

  // 1. Draw Page Background
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.rect(0, 0, 210, 297, "F");

  // 2. Draw Decorative Theme Accents/Background Pattern
  if (theme === "cosmic") {
    // Draw background stars
    doc.setFillColor(255, 255, 255);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 210;
      const y = Math.random() * 297;
      const size = Math.random() * 0.8 + 0.2;
      doc.circle(x, y, size, "F");
    }
    // Draw neon cyan cosmic rings
    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.1);
    doc.circle(20, 40, 15, "S");
    doc.circle(190, 260, 25, "S");
  } else if (theme === "neon") {
    // Grid pattern
    doc.setDrawColor(40, 40, 50);
    doc.setLineWidth(0.15);
    for (let x = 0; x <= 210; x += 15) {
      doc.line(x, 0, x, 297);
    }
    for (let y = 0; y <= 297; y += 15) {
      doc.line(0, y, 210, y);
    }
    // Highlight lines
    doc.setDrawColor(244, 63, 94);
    doc.setLineWidth(0.5);
    doc.line(10, 10, 200, 10);
    doc.line(10, 287, 200, 287);
  } else if (theme === "rose_gold") {
    // Elegant border frames
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.8);
    doc.rect(8, 8, 194, 281, "S");
    doc.setLineWidth(0.2);
    doc.rect(10, 10, 190, 277, "S");
  } else {
    // Playful colorful polka dots
    const dotColors = [[244, 114, 182], [96, 165, 250], [110, 231, 183], [251, 191, 36]];
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 210;
      const y = Math.random() * 297;
      const r = Math.random() * 3 + 1.5;
      const col = dotColors[Math.floor(Math.random() * dotColors.length)];
      doc.setFillColor(col[0], col[1], col[2]);
      doc.circle(x, y, r, "F");
    }
    // Thick neo-brutalist border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 281, "S");
  }

  // 3. Draw Center Feature Card
  const cardX = 15;
  const cardY = 20;
  const cardW = 180;
  const cardH = 257;

  doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
  if (theme === "playful") {
    // Solid shadow effect
    doc.setFillColor(0, 0, 0);
    doc.rect(cardX + 4, cardY + 4, cardW, cardH, "F");
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.rect(cardX, cardY, cardW, cardH, "FD");
  } else if (theme === "neon") {
    doc.setDrawColor(244, 63, 94);
    doc.setLineWidth(1.0);
    doc.rect(cardX, cardY, cardW, cardH, "F");
    doc.rect(cardX, cardY, cardW, cardH, "S");
  } else if (theme === "cosmic") {
    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.8);
    doc.rect(cardX, cardY, cardW, cardH, "F");
    doc.rect(cardX, cardY, cardW, cardH, "S");
  } else {
    // rose gold
    doc.setDrawColor(220, 210, 190);
    doc.setLineWidth(0.4);
    doc.rect(cardX, cardY, cardW, cardH, "F");
    doc.rect(cardX, cardY, cardW, cardH, "S");
  }

  // 4. Recipient Photo (if exists)
  let contentOffsetY = 38;
  if (recipientPhoto) {
    try {
      // Draw frame background behind photo
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      if (theme === "playful") {
        doc.setFillColor(0, 0, 0);
        doc.rect(105 - 20 + 2, 38 + 2, 40, 40, "F");
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1.0);
        doc.rect(105 - 20, 38, 40, 40, "FD");
      } else {
        doc.circle(105, 58, 22, "F");
      }

      // Add image (handles Base64 compressed JPEG/PNG)
      doc.addImage(recipientPhoto, "JPEG", 105 - 19, 58 - 19, 38, 38);

      // Draw elegant overlay circular frame on top for organic feel
      if (theme !== "playful") {
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(1.2);
        doc.circle(105, 58, 19.5, "S");
      }
      contentOffsetY = 85;
    } catch (e) {
      console.error("Failed to add image to PDF:", e);
      contentOffsetY = 38;
    }
  }

  // 5. Title Text (e.g. "Happy 21st!" / "Happy Birthday")
  doc.setFont(fontStyle, "bold");
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(22);
  doc.text(titleText.toUpperCase(), 105, contentOffsetY, { align: "center" });

  // 6. Recipient Name
  doc.setFont(fontStyle, "black");
  doc.setTextColor(primaryTextColor[0], primaryTextColor[1], primaryTextColor[2]);
  doc.setFontSize(36);
  doc.text(name.toUpperCase() + "!", 105, contentOffsetY + 15, { align: "center" });

  // 7. Sparkle Separator
  doc.setFont(fontStyle, "normal");
  doc.setFontSize(16);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("✨ ━━━━━━━ ⭐ ━━━━━━━ ✨", 105, contentOffsetY + 25, { align: "center" });

  // 8. Custom Greeting Message
  doc.setFont(fontStyle, "italic");
  doc.setTextColor(primaryTextColor[0], primaryTextColor[1], primaryTextColor[2]);
  doc.setFontSize(13);
  
  // Wrap text block automatically to fit standard card width
  const splitMessage = doc.splitTextToSize(message || "Wishing you a wonderful day filled with absolute happiness, love, and sweet adventures!", 140);
  doc.text(splitMessage, 105, contentOffsetY + 35, { align: "center", lineHeightFactor: 1.4 });

  const messageHeightEstimation = splitMessage.length * 6;
  const cakeOffsetY = contentOffsetY + 35 + messageHeightEstimation + 10;

  // 9. Draw Custom Virtual Cake Illustration
  const cakeX = 105;
  const cakeY = cakeOffsetY;

  if (cakeOffsetY < 240) {
    // Candles
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    
    // Draw 3 lit candles
    const candleColors = [[236, 72, 153], [34, 211, 238], [234, 179, 8]];
    for (let c = -1; c <= 1; c++) {
      const cx = cakeX + c * 10;
      // Candle stick
      const cCol = candleColors[c + 1];
      doc.setFillColor(cCol[0], cCol[1], cCol[2]);
      doc.rect(cx - 1, cakeY - 14, 2, 14, "FD");
      
      // Flame
      doc.setFillColor(251, 146, 60); // orange flame
      doc.ellipse(cx, cakeY - 17, 1.2, 2.5, "F");
    }

    // Cake Body (Multiple layers)
    let layer1Col = [244, 227, 215]; // Cream
    let layer2Col = [224, 122, 95];  // Strawberry / Pink-orange
    let creamCol = [255, 255, 255];

    if (cakeType === "chocolate") {
      layer1Col = [115, 68, 56]; // chocolate brown
      layer2Col = [74, 42, 34];  // deep fudge
      creamCol = [254, 243, 199]; // custard yellow cream
    } else if (cakeType === "strawberry") {
      layer1Col = [252, 165, 165]; // light pink
      layer2Col = [244, 63, 94];   // strawberry red
      creamCol = [255, 255, 255];
    } else if (cakeType === "rainbow") {
      layer1Col = [147, 197, 253]; // light blue
      layer2Col = [196, 181, 253]; // light purple
      creamCol = [252, 211, 77];  // bright yellow
    } else if (cakeType === "cyberpunk") {
      layer1Col = [24, 24, 27];    // charcoal
      layer2Col = [236, 72, 153];  // hot pink
      creamCol = [34, 211, 238];   // neon cyan
    } else if (cakeType === "space") {
      layer1Col = [30, 27, 75];    // indigo
      layer2Col = [139, 92, 246];  // purple
      creamCol = [253, 224, 71];   // star gold
    }

    // Plate base
    doc.setFillColor(226, 232, 240);
    doc.ellipse(cakeX, cakeY + 18, 28, 4, "FD");

    // Main bottom layer
    doc.setFillColor(layer1Col[0], layer1Col[1], layer1Col[2]);
    doc.rect(cakeX - 22, cakeY, 44, 18, "FD");

    // Middle frosting divider line
    doc.setFillColor(creamCol[0], creamCol[1], creamCol[2]);
    doc.rect(cakeX - 22, cakeY + 8, 44, 2, "F");

    // Top trim frosting drip
    doc.setFillColor(layer2Col[0], layer2Col[1], layer2Col[2]);
    doc.rect(cakeX - 23, cakeY - 2, 46, 3, "F");
    for (let d = -4; d <= 4; d++) {
      doc.circle(cakeX + d * 5, cakeY + 1, 1.8, "F");
    }

    // Cherries or sprinkles on top
    doc.setFillColor(239, 68, 68); // cherry red
    doc.circle(cakeX, cakeY - 3.5, 2.2, "F");
    doc.circle(cakeX - 12, cakeY - 3.5, 2.2, "F");
    doc.circle(cakeX + 12, cakeY - 3.5, 2.2, "F");
  }

  // 10. Footer / Signature message
  doc.setFont(fontStyle, "bold");
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFontSize(12);
  doc.text(fromText, 105, 262, { align: "center" });

  doc.setFont(fontStyle, "normal");
  doc.setTextColor(primaryTextColor[0], primaryTextColor[1], primaryTextColor[2]);
  doc.setFontSize(8);
  doc.text("Created with JoySpark • Interactive Synthesizer Birthday Cards", 105, 270, { align: "center" });

  // Save the PDF locally with recipient name
  const safeFilename = `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_birthday_card.pdf`;
  doc.save(safeFilename);
}
