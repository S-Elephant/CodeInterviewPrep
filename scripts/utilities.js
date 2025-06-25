/**
 * Capitalize the first letter of a string and makes the rest lowercase.
 * @param {string} inputString - The string to capitalize.
 * @returns {string} The capitalized string.
 * @throws {TypeError} If input is not a string.
 * 
 * @example
 * // Returns "Hello"
 * capitalizeFirstLetter("hello");
 * 
 * @example
 * // Returns "Hello world"
 * capitalizeFirstLetter("HELLO WORLD");
 */
function capitalizeFirstLetter(inputString) {
    if (typeof inputString !== 'string') {
        throw new TypeError('Input must be a string');
    }
    
    if (inputString.length === 0)
        return inputString;
    
    const firstChar = inputString.charAt(0).toUpperCase();
    const remainingChars = inputString.slice(1).toLowerCase();
    
    return firstChar + remainingChars;
}

/**
 * Set a cookie with the given name, value, and expiration days.
 * @param {string} name - Cookie name.
 * @param {string} value - Cookie value.
 * @param {number} [days=365] - Number of days until cookie expires (default: 365).
 */
function setCookie(name, value, days = 365) {
    // Create expiration date
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    // Set the cookie with name, value, expiration, and path
    document.cookie = `${name}=${value};${expires};path=/`;
}

/**
 * Retrieve a cookie by name.
 * @param {string} name - Name of the cookie to retrieve.
 * @returns {string|null} Cookie value if found, null otherwise.
 */
function getCookie(name) {
    // Prepare the name we're looking for (with equals sign).
    const nameEQ = `${name}=`;
    // Split all cookies into an array.
    const ca = document.cookie.split(';');
    // Loop through all cookies.
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        // Trim whitespace from cookie string.
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        // If we find the cookie we're looking for.
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }

    // Cookie not found.
    return null;
}

/**
 * Shuffles array in place using Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The shuffled array.
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Linear interpolation (lerp) function with rounding
 *
 * @param {number} start - The starting value (inclusive)
 * @param {number} end - The ending value (inclusive)
 * @param {number} t - Interpolation factor (typically 0-1)
 * @returns {number} Interpolated value, rounded to nearest integer
 */
 function lerp(start, end, t) {
    return Math.round(start + (end - start) * t);
}