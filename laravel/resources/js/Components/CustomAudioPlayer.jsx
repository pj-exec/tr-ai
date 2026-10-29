import { useRef, useState, useEffect } from "react";
import { FaPlay, FaPause, FaRedo } from "react-icons/fa";

const formatTime = (time) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const CustomAudioPlayer = ({ url }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    setDuration(audio.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
    }

    return () => {
      if (audio) {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "500px",
        margin: "auto",
      }}
    >
      <audio ref={audioRef} src={url} preload="auto" />

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        step={0.1}
        onChange={handleSeek}
        style={{ width: "100%" }}
      />

      {/* Controls + Duration */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "1.5rem" }}>
          <button onClick={handlePlayPause} style={iconStyle}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={handleReplay} style={iconStyle}>
            <FaRedo />
          </button>
        </div>
        <span style={{ fontSize: "0.9rem", color: "#555" }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

const iconStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#333",
  fontSize: "1.1rem",
};

export default CustomAudioPlayer;
