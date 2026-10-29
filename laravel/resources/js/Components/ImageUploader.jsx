import InputLabel from "@/Components/InputLabel";
import FileInput from "@/Components/FileInput";
import Image from "@/Components/Image";
import DangerButton from "@/Components/DangerButton";

export default function ImageUploader({
  imageSrc,
  handleImageChanges,
  labelValue,
  inputName,
  inputId,
  fileInputRef,
  imagetype,
  isMultiple,
  removeUploadedImage,
  imageStyle = "",
  children,
}) {
  const checkImageSrcType = () => {
    if (Array.isArray(imageSrc)) {
      return imageSrc.length !== 0;
    } else {
      return imageSrc;
    }
  };
  let imageUrl = null;

  if (imageSrc instanceof Blob) {
    imageUrl = URL.createObjectURL(imageSrc);
  } else {
    console.warn("imageSrc is not a valid Blob or File:", imageSrc);
  }

  return (
    <div
      className={`mb-4 ${checkImageSrcType() ? "border-solid border-2" : ""}`}
    >
      <div className="flex items-center pl-4">
        <InputLabel
          htmlFor={inputId}
          className="pr-2 whitespace-nowrap"
          value={labelValue}
        />
        <FileInput
          imagetype={imagetype}
          id={inputId}
          ref={fileInputRef}
          name={inputName}
          onChange={handleImageChanges}
          multiple={isMultiple}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
      </div>
      {imageUrl && (
        <div>
          {Array.isArray(imageUrl) ? (
            imageUrl.map((image) => (
              <div className="flex items-center mb-4" key={image}>
                <figure className="m-0 mr-4">
                  <img className="w-80 h-auto" src={image} />
                </figure>
                <DangerButton onClick={() => removeUploadedImage(image)}>
                  remove
                </DangerButton>
              </div>
            ))
          ) : (
            <div className={imageStyle.imgContainer}>
              <Image size={imageStyle.size} imageSrc={imageUrl} />
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
