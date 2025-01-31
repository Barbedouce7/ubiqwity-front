import { useState } from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/solid";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    // Réinitialiser après 2 secondes
    setTimeout(() => setCopied(false), 2000);
  };

  return (
  <button
    onClick={handleCopy}
    className="inline rounded-md transition-colors 
               bg-gray-800 hover:bg-gray-700 text-white p-1 m-2"
  >
    {copied ? (
      <CheckIcon className="h-4 w-4 text-green-400 transition-all" />
    ) : (
      <ClipboardIcon className="h-4 w-4 text-gray-400 hover:text-white transition-all" />
    )}
  </button>
  );
};

export default CopyButton;
