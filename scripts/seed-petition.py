#!/usr/bin/env python3
"""Seed 120 sample petition signers for UI testing."""

import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "/home/alexhillman/lift-philly/liftphilly.db"

NAMES = [
    "Marcus Johnson", "Keisha Williams", "Roberto Diaz", "Priya Patel",
    "DeShawn Harris", "Luz Morales", "Anthony Nguyen", "Tamika Brown",
    "Carlos Rivera", "Stephanie Kim", "Jerome Washington", "Fatima Al-Hassan",
    "Brian O'Connor", "Yolanda Thomas", "Miguel Santos", "Denise Carter",
    "Jamal Robinson", "Rosa Perez", "Kevin Chen", "Aaliyah Davis",
    "Patrick Murphy", "Nadine Baptiste", "Isaiah Green", "Maria Gonzalez",
    "Devon Clarke", "Ingrid Okafor", "Rashid Ahmed", "Brianna Scott",
    "Hector Reyes", "LaTonya Moore", "Seun Adeyemi", "Colleen Brady",
    "Terrence Hill", "Mei-Ling Chang", "Darius Freeman", "Anita Kowalski",
    "Solomon Burke", "Jasmine Pierce", "Rafael Torres", "Gwendolyn Hall",
    "Nnamdi Obi", "Sharon Goldstein", "Antoine Leblanc", "Crystal Jackson",
    "Vikram Shah", "Rhonda Mitchell", "Elijah Cooper", "Sunita Krishnan",
    "Tyrone Edwards", "Marisol Vega", "Desmond Murray", "Patricia Lawson",
    "Omar Farooq", "Tanya Reeves", "Brandon Foster", "Chinyere Eze",
    "Wesley Hamilton", "Adia Walker", "Fernando Ortiz", "Deborah Young",
    "Kwame Mensah", "Sandra O'Brien", "Jalen Brooks", "Fatou Diallo",
    "Gerald Simmons", "Yuki Tanaka", "Cedric Thompson", "Lorraine Adams",
    "Abubakar Ibrahim", "Theresa Flynn", "Janice Ward", "Moses Osei",
    "Courtney Jenkins", "Dolores Estrada", "Nathaniel Price", "Sasha Petrov",
    "Tyisha Miles", "Franklin Ruiz", "Ebony Richardson", "James Tran",
    "Lakisha Howard", "Vincent Marchetti", "Alicia Ross", "Kofi Asante",
    "Monique Ellis", "Hassan Malik", "Renee Patterson", "Donovan Blake",
    "Camille Rousseau", "Tremaine Byrd", "Lucia Fernandez", "Devon Singleton",
    "Wanda Perkins", "Emmanuel Okonkwo", "Tracy Nguyen", "Reginald Sanders",
    "Claudia Hernandez", "Sterling Knight", "Imani Graham", "Tony Moretti",
    "Phyllis Manning", "Kwabena Owusu", "April Coleman", "Marcus Webb",
    "Simone Dupont", "Roland Hayes", "Blessing Adebayo", "Cheryl Zimmerman",
    "Alexis Ford", "Tariq Abdullah", "Vanessa Cruz", "Howard Stern",
    "Nkechi Okafor", "Calvin Booker", "Rosalyn Espinoza", "Dwayne Porter",
    "Amara Diop", "Mitchell Olsen", "Shanice Watkins", "Felipe Castillo",
]

BUSINESSES = [
    "South Street Barbershop", "Kensington Auto Repair", "Fishtown Food Truck Co.",
    "West Philly Daycare Center", "North Philly Music Studio", "Old City Nail Salon",
    "Strawberry Mansion Catering", "Germantown Tailors", "Grays Ferry Laundromat",
    "Point Breeze Beauty Supply", "Manayunk Printing Co.", "Frankford Flower Shop",
    "Brewerytown Fitness", "Fairmount Dog Grooming", "Cedar Park Café",
    "Overbrook Electronics Repair", "Cobbs Creek Landscaping", "Roxborough Bakery",
    "Hunting Park Tire & Auto", "Mayfair Alterations", "Tacony Hardware Store",
    "Bridesburg Plumbing", "Richmond Cleaning Services", "Holmesburg Deli",
    "Torresdale Tax Services", "Bustleton Driving School", "Fox Chase Flooring",
    "Somerton Event Space", "Northeast Philly Catering", "Olney Bookstore",
    "Logan Music Lessons", "Feltonville Barbershop", "Nicetown Auto Body",
    "Tioga Convenience Store", "Glenwood Recording Studio", "Sharswood Daycare",
    "Temple Area Food Truck", "Fairmount Healthcare", "Spring Garden Photography",
    "Northern Liberties Design Co.", "Bella Vista Restaurant", "Queen Village Yoga",
    "Passyunk Sq. Dog Walking", "East Passyunk Vintage", "Pennsport Plumbing",
    "Whitman Catering", "Girard Estates Deli", "Elmwood Cleaning",
    "Eastwick Landscaping", "Island Ave. Auto Repair",
]

ZIPS = [
    "19103", "19107", "19106", "19122", "19123", "19125", "19130",
    "19132", "19133", "19134", "19140", "19143", "19146", "19147",
    "19148", "19104", "19139", "19142", "19145", "19150", "19151",
    "19115", "19116", "19111", "19149", "19135", "19136", "19152",
]

COMMENTS = [
    "I've run my business in this neighborhood for 15 years.",
    "These taxes are going to force me to close my doors.",
    "Small business owners built this city. We deserve better.",
    "My employees depend on me staying open.",
    "I can't afford to pay myself and pay these taxes.",
    "This is crushing working families in Philadelphia.",
    "We need council members who actually understand small business.",
    "I've been here since before the gentrification. Don't push us out.",
    "Fighting for fair taxation for everyone in Philly.",
    "My parents built this business. I'm not going to lose it.",
    None, None, None, None, None,  # ~⅓ leave no comment
]

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check how many already exist
cur.execute("SELECT COUNT(*) FROM petition_signers")
existing = cur.fetchone()[0]
print(f"Existing signers: {existing}")

# Don't re-seed if already done
cur.execute("SELECT COUNT(*) FROM petition_signers WHERE email LIKE '%@seed.test'")
seed_count = cur.fetchone()[0]
if seed_count > 0:
    print(f"Already seeded ({seed_count} seed records). Remove them first if you want to re-seed.")
    conn.close()
    exit(0)

base_date = datetime(2026, 1, 15)
inserted = 0

random.shuffle(NAMES)

for i, name in enumerate(NAMES):
    email = name.lower().replace(" ", ".") + "@seed.test"
    zip_code = random.choice(ZIPS)
    has_biz = random.random() < 0.55
    business_name = random.choice(BUSINESSES) if has_biz else None
    business_url = None
    comment = random.choice(COMMENTS)

    # Spread over ~80 days, with more recent signers
    days_ago = max(0, int(random.expovariate(0.04)))
    signed_at = base_date + timedelta(days=i * 0.6, hours=random.randint(0, 23))

    cur.execute("""
        INSERT INTO petition_signers (name, email, zip_code, business_name, business_url, comment, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
    """, (name, email, zip_code, business_name, business_url, comment, signed_at.isoformat()))
    inserted += 1

conn.commit()
conn.close()
print(f"Inserted {inserted} sample signers.")
