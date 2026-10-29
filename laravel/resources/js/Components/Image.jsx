export default function Image({ imageSrc, size }) {
  return (
    <figure className={size}>
      <img src={imageSrc} />
    </figure>
  );
}
