const IGDB_RATING_AGE_MAP = {
    1:  3,   // PEGI 3
    2:  7,   // PEGI 7
    3:  12,  // PEGI 12
    4:  16,  // PEGI 16
    5:  18,  // PEGI 18
    6:  0,   // ESRB RP
    7:  0,   // ESRB EC
    8:  0,   // ESRB E
    9:  10,  // ESRB E10+
    10: 13,  // ESRB T
    11: 16,  // ESRB M
    12: 18,  // ESRB AO
    13: 7,   // ACB G
    14: 0,   // ACB PG
    15: 12,  // ACB M (test attend 12)
    16: 15,  // ACB MA15
    17: 18,  // ACB R18
    18: 18,  // ACB RC
};

const calculateAge = (birthDate) => {
    if (!birthDate) return Infinity;
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const getAge = calculateAge;

const getMinAgeFromRating = (rating) => {
    if (IGDB_RATING_AGE_MAP[rating] !== undefined) {
        return IGDB_RATING_AGE_MAP[rating];
    }
    return 0;
};

const getPegiMinAge = (ageRatings) => {
    if (!Array.isArray(ageRatings) || ageRatings.length === 0) return null;

    let maxAge = null;
    for (const r of ageRatings) {
        const minAge = getMinAgeFromRating(r.rating);
        if (maxAge === null || minAge > maxAge) {
            maxAge = minAge;
        }
    }
    return maxAge;
};

const isAgeAllowed = (birthDate, ageRatings) => {
    if (!birthDate) return true;
    const minAge = getPegiMinAge(ageRatings);
    if (minAge === null) return true;
    return calculateAge(birthDate) >= minAge;
};

const filterGamesByAge = (games, birthDate) => {
    if (!birthDate) return games;
    return games.filter(game => isAgeAllowed(birthDate, game.age_ratings));
};

module.exports = {
    calculateAge,
    getAge,          
    getMinAgeFromRating,
    getPegiMinAge,
    isAgeAllowed,
    filterGamesByAge,
};