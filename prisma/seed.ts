import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  await db.product.deleteMany();
  await db.product.createMany({
    data: [
      { name: "Classic Thai Tea", tagline: "Manis legit, aroma khas", price: 12000, emoji: "🧋",
        ingredients: ["Teh Thai", "Susu kental manis", "Susu evaporasi", "Es batu"],
        benefits: ["Mood booster", "Kafein ringan penambah fokus", "Menyegarkan"] },
      { name: "Thai Green Tea", tagline: "Segar, wangi, ringan", price: 13000, emoji: "🍵",
        ingredients: ["Teh hijau Thai", "Susu", "Gula", "Es batu"],
        benefits: ["Kaya antioksidan", "Bantu fokus", "Rasa lebih ringan"] },
      { name: "Thai Tea Boba", tagline: "Kenyal, puas, bikin nagih", price: 16000, emoji: "🧋",
        ingredients: ["Teh Thai", "Susu", "Boba tapioka", "Es batu"],
        benefits: ["Sumber energi cepat", "Tekstur kenyal menyenangkan", "Pas untuk teman ngemil"] },
      { name: "Thai Tea Cheese Foam", tagline: "Gurih manis, premium", price: 18000, emoji: "🧀",
        ingredients: ["Teh Thai", "Cheese foam", "Susu", "Es batu"],
        benefits: ["Sumber kalsium dari keju", "Rasa creamy mewah", "Bikin mood naik"] },
    ],
  });
}
main().finally(() => db.$disconnect());
