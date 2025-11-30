"""Generate overflow field definitions for Contact model"""

# After the skiptrace fields section (around line 186-189), add these:

print("\n    # Skiptrace Landline overflow (1-30)")
for i in range(1, 31):
    print(f"    skiptrace_landline_{i} = Column(String(20))")
    print(f"    skiptrace_landline_{i}_dnc = Column(Boolean)")

print("\n    # Skiptrace Wireless overflow (1-30)")
for i in range(1, 31):
    print(f"    skiptrace_wireless_{i} = Column(String(20))")
    print(f"    skiptrace_wireless_{i}_dnc = Column(Boolean)")

print("\n    # Skiptrace B2B Phone overflow (1-30)")
for i in range(1, 31):
    print(f"    skiptrace_b2b_phone_{i} = Column(String(20))")
    print(f"    skiptrace_b2b_phone_{i}_dnc = Column(Boolean)")

print("\n    # Personal Email overflow (1-30)")
for i in range(1, 31):
    print(f"    personal_email_{i} = Column(String(255))")

print("\n    # Business Email overflow (2-30)")
for i in range(2, 31):
    print(f"    business_email_{i} = Column(String(255))")

print("\n    # Personal Verified Email overflow (1-30)")
for i in range(1, 31):
    print(f"    personal_verified_email_{i} = Column(String(255))")

print("\n    # Business Verified Email overflow (1-30)")
for i in range(1, 31):
    print(f"    business_verified_email_{i} = Column(String(255))")

print("\n    # SHA256 Personal Email overflow (1-30)")
for i in range(1, 31):
    print(f"    sha256_personal_email_{i} = Column(String(64))")

print("\n    # SHA256 Business Email overflow (1-30)")
for i in range(1, 31):
    print(f"    sha256_business_email_{i} = Column(String(64))")
