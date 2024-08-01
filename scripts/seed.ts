const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
    try {
        await database.category.createMany({
            data: [
                { name: "Engineering" },
                { name: "Support" },
                { name: "Marketing" },
                { name: "Retail" },
                { name: "Management" },
                { name: "Business" },
                { name: "Tools" }
            ]
        });

        console.log("Success");
    }
    catch (e) {
        console.log("Error seeding database categories", e);
    }
    finally {
        await database.$disconnect();
    }
}

main();