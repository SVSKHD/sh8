/* two hearts, two codes — birthday is month (1-12), day, year */
export const USERS = {
  2607: { name: "Hithesh", pet: "cuore mio", birthday: { month: 7, day: 26, year: 1995 } },
  1710: { name: "Spoorthy", pet: "cuore mia", birthday: { month: 10, day: 17, year: 1999 } },
};

export const userByName = (n) => Object.values(USERS).find((u) => u.name === n) || null;

/* each person's user id is their date of birth (ddmmyyyy) — stamped on
   every record they add or change (see stores/us.js), and the only two ids
   firestore.rules accept in those fields */
const pad = (n) => String(n).padStart(2, "0");
export const userId = (u) => pad(u.birthday.day) + pad(u.birthday.month) + u.birthday.year;
