import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function downloadImagesAsZip(
  base64Images,
  zipFilename = "images.zip",
  extension = "png"
) {
  const zip = new JSZip();

  base64Images.forEach((base64, index) => {
    // Directly add the raw base64 string as binary
    zip.file(`image${index + 1}.${extension}`, base64, { base64: true });
  });

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, zipFilename);
}
