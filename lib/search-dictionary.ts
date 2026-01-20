export type SynonymMap = Record<string, string[]>;

export const SEARCH_DICTIONARY: SynonymMap = {
    // --- Makes ---
    "Mercedes-Benz": ["Mercedes", "Merceds", "Marsides", "Mersedes", "مرسيدس", "مرسديس", "بانز", "Benz", "220", "250", "class c", "classes c"],
    "BMW": ["B M W", "BM", "Bay em", "بي ام", "بي إم دبليو", "بي ام دبليو", "Serie 3", "Serie 5", "X5", "X6"],
    "Audi": ["Audy", "Aydo", "أودي", "اودي", "الأودي", "A3", "A4", "Q5", "Q7"],
    "Volkswagen": ["VW", "Volks", "Folf", "Golf", "Passat", "Tiguan", "فولكس فاجن", "فولكس", "فولسفاكن", "فولف", "جولف", "غوف", "طوارق"],
    "Renault": ["Rono", "Renolt", "رونو", "رينو", "كليو", "Clio", "Megane", "Kangoo", "Dacia"], // Dacia often confused
    "Dacia": ["Dasia", "Daci", "داسيا", "داكيا", "Logan", "Duster", "Dokker", "Sandero"],
    "Peugeot": ["Peugot", "Pejo", "Pijo", "بيجو", "بجو", "208", "206", "308", "3008", "Partner"],
    "Citroen": ["Citroën", "Sitrwen", "Sitroen", "سيتروين", "ستروين", "سيتغوين", "C3", "Berlingo"],
    "Fiat": ["Fyat", "فيات", "فيات", "Punto", "500", "Tipo", "Doblo"],
    "Toyota": ["Toyata", "Yaris", "Corolla", "Hilux", "Prado", "تويوتا", "طويوطا", "ياريس"],
    "Hyundai": ["Hyunday", "Hundai", "هيونداي", "هونداي", "i10", "i20", "Accent", "Tucson", "Santa fe"],
    "Kia": ["Kya", "كيا", "Picanto", "Sportage", "Sorento", "Rio"],
    "Ford": ["Fird", "فورد", "Fiesta", "Focus", "Ranger", "Kuga"],
    "Nissan": ["Nisan", "نيسان", "Qashqai", "Juke", "Navara"],
    "Land Rover": ["Range Rover", "Range", "Rover", "Land", "رانج", "رنج", "روفر", "Evoque", "Velar", "Sport", "Vogue"],
    "Porsche": ["Porsch", "Porche", "بورش", "بورشب", "Cayenne", "Macan", "911", "Panamera"],
    "Ferrari": ["Ferari", "فراري", "فيراري"],
    "Maserati": ["Mazarati", "مازيراتي", "مازراتي"],

    // --- Cities ---
    "Casablanca": ["Casa", "Caza", "Dar el beida", "الدار البيضاء", "كازا", "البيضاء"],
    "Rabat": ["Rba", "الرباط", "رباط"],
    "Marrakech": ["Marrakesh", "Marra", "مراكش"],
    "Tanger": ["Tangier", "Tanja", "طنجة"],
    "Agadir": ["Agadir", "أكادير", "اكدير"],
    "Fes": ["Fez", "Fas", "فاس"],
    "Meknes": ["Maknes", "مكناس"],
    "Oujda": ["Wajda", "وجدة"],
    "Tetouan": ["Titwan", "تطوان"],
    "Kenitra": ["Qnitra", "Knitra", "القنيطرة", "قنيطرة"],
    "Sale": ["Sla", "سلا"],
    "El Jadida": ["Jadida", "الجديدة"],

    // --- Fuel Types ---
    "Petrol": ["Essence", "Benzine", "بنزين", "Gasoline"],
    "Diesel": ["Diesel", "Mazot", "ديزل", "مازوت"],
    "Hybrid": ["Hybride", "Hybrid", "هجين"],
    "Electric": ["Electrique", "Electric", "كهربائي", "كهرباء"],
    "Manual": ["Manuelle", "Manuel", "يدوي", "عادي"],
    "Automatic": ["Automatique", "Auto", "أوتوماتيك", "اوتوماتيك"],

    // --- Colors ---
    "Black": ["Noir", "Nwar", "أسود", "اسود", "كحل"],
    "White": ["Blanc", "Abyad", "أبيض", "بيض"],
    "Grey": ["Gris", "Ramadi", "رمادي", "رصاصي"],
    "Silver": ["Argent", "Fidi", "فضي"],
    "Blue": ["Bleu", "Azraq", "أزرق", "زرق"],
    "Red": ["Rouge", "Ahmar", "أحمر", "حمر"],
    "Green": ["Vert", "Akhdar", "أخضر", "خضر"],
    "Yellow": ["Jaune", "Asfar", "أصفر", "صفر"]
};
