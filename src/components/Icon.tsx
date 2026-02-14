interface IconProps {
  /** Raw SVG string (e.g. from import './asset.svg?raw') */
  src: string;
  className?: string;
  'aria-hidden'?: boolean;
}

const Icon = ({ src, className, 'aria-hidden': ariaHidden = true }: IconProps) => (
  <span
    className={className}
    aria-hidden={ariaHidden}
    // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- SVG from our own assets (imported ?raw)
    dangerouslySetInnerHTML={{ __html: src }}
  />
);

export default Icon;
