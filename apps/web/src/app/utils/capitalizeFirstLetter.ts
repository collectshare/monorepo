export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function capitalizeFirstLetters(sentence: string) {
  return sentence
    .toLowerCase() // Ensure the rest of the text is lowercase
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
}
