/* two hearts, two codes */
export const USERS = {
  2607: { name: "Hithesh", pet: "cuore mio" },
  1710: { name: "Spoorthy", pet: "cuore mia" },
};

export const userByName = (n) => Object.values(USERS).find((u) => u.name === n) || null;
