
export const FormatNumberWithSpaces = ({ number }) => {
    if (number === undefined || number === null) return '';
    let numStr = number.toString();
    let [integerPart, decimalPart] = numStr.split('.');

    // Formater la partie entière avec des espaces
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (decimalPart) {
      // Chercher la première suite de zéros de 3 ou plus
      let match = decimalPart.match(/^(0{3,})/);
      if (match) {
        let zeros = match[0];
        decimalPart = decimalPart.replace(zeros, `"${Math.floor(zeros.length / 3)}"`);
      }
    }

    const formattedNumber = `${integerPart}${decimalPart ? `.${decimalPart}` : ''}`;

    // Diviser le nombre formaté pour appliquer le style au chiffre spécial
    const parts = formattedNumber.split('"');
    return (
      <span>
        {parts[0]}
        {parts[1] && <sup className="text-xs">{parts[1]}</sup>}
        {parts[2]}
      </span>
    );
};
