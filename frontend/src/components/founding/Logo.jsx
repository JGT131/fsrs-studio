// FSRS — Modern Firm lockup.
//
//   [hex mark]  FSRS │ Fire Suppression Retrofit Studio
//
// - FSRS: bold, minimalist, white
// - Separator: thin red vertical line
// - Caption: italic, professional, slightly smaller
//
// Props
//   size           SVG mark height in px (default 32)
//   showWordmark   Render "FSRS" wordmark (default true)
//   showTagline    Render the italic caption (default false; header keeps
//                  it always-on, footer shows it as a larger lockup)
//   variant        "inline" (default — caption sits to the right of FSRS
//                  separated by a thin red rule) or "stacked" (caption sits
//                  beneath FSRS, no rule). Stacked is used by the footer
//                  when there is more vertical room.

export default function Logo({
    size = 32,
    showWordmark = true,
    showTagline = false,
    variant = "inline",
    className = "",
    "data-testid": testId = "fsrs-logo",
}) {
    const wordSize = Math.max(14, size * 0.62);
    const captionSize = Math.max(10, size * 0.32);

    return (
        <div
            className={`inline-flex items-center gap-3 ${className}`}
            data-testid={testId}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="FSRS — Fire Suppression Retrofit Studio"
                role="img"
            >
                {/* Hex shield outline */}
                <path
                    d="M20 1.5 L36 9 V31 L20 38.5 L4 31 V9 Z"
                    stroke="#EF4444"
                    strokeWidth="1.25"
                    fill="#000"
                />
                <line x1="20" y1="6" x2="20" y2="11" stroke="#EF4444" strokeWidth="0.75" />
                <line x1="20" y1="29" x2="20" y2="34" stroke="#EF4444" strokeWidth="0.75" />
                <line x1="6.5" y1="20" x2="11" y2="20" stroke="#EF4444" strokeWidth="0.75" />
                <line x1="29" y1="20" x2="33.5" y2="20" stroke="#EF4444" strokeWidth="0.75" />
                {/* Flame */}
                <path
                    d="M20 11 C22.5 14.5 24.5 16.5 24.5 19.5 C24.5 22.6 22.4 24.8 20 24.8 C17.6 24.8 15.5 22.6 15.5 19.5 C15.5 16.5 17.5 14.5 20 11 Z"
                    fill="#EF4444"
                />
                {/* Droplet highlight (sprinkler) */}
                <path
                    d="M20 17 C21 18.5 22 19.6 22 21 C22 22.4 21.1 23.4 20 23.4 C18.9 23.4 18 22.4 18 21 C18 19.6 19 18.5 20 17 Z"
                    fill="#FCA5A5"
                />
                <line x1="20" y1="26.5" x2="20" y2="28.5" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.7" />
            </svg>

            {showWordmark && (
                <>
                    {variant === "stacked" ? (
                        <div className="flex flex-col leading-none">
                            <span
                                className="fsrs-wordmark text-white font-extrabold tracking-tight"
                                style={{ fontSize: wordSize }}
                            >
                                FSRS
                            </span>
                            {showTagline && (
                                <span
                                    className="italic text-slate-300 mt-1.5 font-light tracking-wide"
                                    style={{ fontSize: captionSize }}
                                >
                                    Fire Suppression Retrofit Studio
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 leading-none">
                            <span
                                className="fsrs-wordmark text-white font-extrabold tracking-tight"
                                style={{ fontSize: wordSize }}
                            >
                                FSRS
                            </span>
                            {showTagline && (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="block bg-red-500"
                                        style={{
                                            width: 1,
                                            height: Math.round(wordSize * 0.85),
                                        }}
                                    />
                                    <span
                                        className="italic text-slate-300 font-light tracking-wide whitespace-nowrap"
                                        style={{ fontSize: captionSize }}
                                    >
                                        Fire Suppression Retrofit Studio
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
