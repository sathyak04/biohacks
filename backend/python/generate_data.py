"""
Generate a curated cancer mutation dataset based on real COSMIC mutation patterns.

Genes: TP53, BRCA1, BRCA2, KRAS, BRAF, PIK3CA, EGFR, PTEN
Each mutation has: gene, position, ref_aa, alt_aa, mutation_id, cancer_types, frequency, is_driver

Also generates a training dataset for the cancer-type classifier:
  - Input: binary feature vector (which mutations are present)
  - Output: cancer type
"""

import os
import json
import random
import csv

# ============================================================
# REAL mutation data (based on COSMIC top mutations)
# ============================================================

TP53_MUTATIONS = [
    {"pos": 175, "ref": "R", "alt": "H", "id": "R175H", "cancers": ["breast", "colorectal", "lung", "ovarian"], "freq": 0.06, "driver": True,
     "desc": "Most common TP53 hotspot. Disrupts DNA-binding domain. Found in Li-Fraumeni syndrome."},
    {"pos": 248, "ref": "R", "alt": "W", "id": "R248W", "cancers": ["colorectal", "breast", "brain", "lung"], "freq": 0.05, "driver": True,
     "desc": "Contact mutation — directly disrupts DNA contact. Gain-of-function properties."},
    {"pos": 248, "ref": "R", "alt": "Q", "id": "R248Q", "cancers": ["breast", "ovarian", "lung", "pancreatic"], "freq": 0.04, "driver": True,
     "desc": "Second most common at position 248. Strong oncogenic gain-of-function."},
    {"pos": 273, "ref": "R", "alt": "H", "id": "R273H", "cancers": ["colorectal", "breast", "lung", "bladder"], "freq": 0.05, "driver": True,
     "desc": "Contact mutation at DNA-binding surface. Retains partial folding."},
    {"pos": 273, "ref": "R", "alt": "C", "id": "R273C", "cancers": ["lung", "colorectal", "skin", "brain"], "freq": 0.03, "driver": True,
     "desc": "Disrupts arginine critical for DNA contact. Common in squamous cell carcinomas."},
    {"pos": 245, "ref": "G", "alt": "S", "id": "G245S", "cancers": ["breast", "colorectal", "brain"], "freq": 0.02, "driver": True,
     "desc": "Structural mutation near L3 loop. Destabilizes local protein structure."},
    {"pos": 249, "ref": "R", "alt": "S", "id": "R249S", "cancers": ["liver"], "freq": 0.04, "driver": True,
     "desc": "Aflatoxin-associated mutation. Hallmark of hepatocellular carcinoma in Africa/Asia."},
    {"pos": 220, "ref": "Y", "alt": "C", "id": "Y220C", "cancers": ["breast", "lung", "colorectal"], "freq": 0.02, "driver": True,
     "desc": "Creates a druggable surface crevice. Target of novel p53 reactivation therapies."},
    {"pos": 176, "ref": "C", "alt": "F", "id": "C176F", "cancers": ["breast", "ovarian"], "freq": 0.01, "driver": True,
     "desc": "Zinc-binding site mutation. Disrupts structural zinc coordination."},
    {"pos": 282, "ref": "R", "alt": "W", "id": "R282W", "cancers": ["breast", "colorectal", "lung"], "freq": 0.02, "driver": True,
     "desc": "Structural mutation in beta-sandwich. Thermodynamically destabilizing."},
    {"pos": 157, "ref": "V", "alt": "F", "id": "V157F", "cancers": ["lung", "esophageal"], "freq": 0.02, "driver": True,
     "desc": "Smoking-associated hotspot. Enriched in lung squamous cell carcinoma."},
    {"pos": 158, "ref": "R", "alt": "L", "id": "R158L", "cancers": ["lung", "colorectal"], "freq": 0.01, "driver": True,
     "desc": "Disrupts salt bridge in DNA-binding domain. Moderate frequency."},
    {"pos": 179, "ref": "H", "alt": "R", "id": "H179R", "cancers": ["breast", "colorectal", "brain"], "freq": 0.01, "driver": True,
     "desc": "Located near zinc coordination site. Affects protein stability."},
    {"pos": 196, "ref": "V", "alt": "E", "id": "V196E", "cancers": ["breast"], "freq": 0.005, "driver": False,
     "desc": "Passenger variant. Minimal effect on protein function."},
    {"pos": 306, "ref": "R", "alt": "Q", "id": "R306Q", "cancers": ["colorectal"], "freq": 0.003, "driver": False,
     "desc": "Located in tetramerization domain. Uncertain significance."},
]

BRCA1_MUTATIONS = [
    {"pos": 185, "ref": "C", "alt": "AG", "id": "185delAG", "cancers": ["breast", "ovarian"], "freq": 0.08, "driver": True,
     "desc": "Ashkenazi Jewish founder mutation. Frameshift causing truncation. High penetrance."},
    {"pos": 1794, "ref": "C", "alt": "-", "id": "5382insC", "cancers": ["breast", "ovarian"], "freq": 0.05, "driver": True,
     "desc": "Ashkenazi/Eastern European founder mutation. Frameshift at BRCT domain."},
    {"pos": 68, "ref": "C", "alt": "G", "id": "C68G", "cancers": ["breast"], "freq": 0.02, "driver": True,
     "desc": "RING domain mutation. Disrupts BRCA1-BARD1 interaction critical for DNA repair."},
    {"pos": 1775, "ref": "M", "alt": "R", "id": "M1775R", "cancers": ["breast"], "freq": 0.01, "driver": True,
     "desc": "BRCT domain mutation. Impairs phospho-protein binding and DNA damage response."},
    {"pos": 1685, "ref": "A", "alt": "T", "id": "A1685T", "cancers": ["breast"], "freq": 0.01, "driver": True,
     "desc": "Near BRCT domain. Affects protein folding and stability."},
    {"pos": 61, "ref": "C", "alt": "G", "id": "C61G", "cancers": ["breast", "ovarian", "pancreatic"], "freq": 0.02, "driver": True,
     "desc": "RING finger domain. Abolishes E3 ubiquitin ligase activity."},
    {"pos": 1613, "ref": "Q", "alt": "X", "id": "Q1613X", "cancers": ["breast"], "freq": 0.01, "driver": True,
     "desc": "Nonsense mutation causing premature stop codon. Loss of BRCT domains."},
    {"pos": 871, "ref": "E", "alt": "X", "id": "E871X", "cancers": ["breast"], "freq": 0.008, "driver": True,
     "desc": "Truncating mutation. Removes majority of functional domains."},
    {"pos": 1038, "ref": "K", "alt": "N", "id": "K1038N", "cancers": ["breast"], "freq": 0.005, "driver": False,
     "desc": "Variant of uncertain significance. Located in coiled-coil domain."},
    {"pos": 1183, "ref": "S", "alt": "R", "id": "S1183R", "cancers": ["breast"], "freq": 0.003, "driver": False,
     "desc": "Benign polymorphism. No effect on protein function in functional assays."},
]

BRCA2_MUTATIONS = [
    {"pos": 2058, "ref": "T", "alt": "-", "id": "6174delT", "cancers": ["breast", "ovarian", "pancreatic"], "freq": 0.06, "driver": True,
     "desc": "Ashkenazi Jewish founder mutation. Frameshift causing truncated protein."},
    {"pos": 999, "ref": "S", "alt": "-", "id": "999del5", "cancers": ["breast"], "freq": 0.03, "driver": True,
     "desc": "Icelandic founder mutation. Five-nucleotide deletion in exon 9."},
    {"pos": 2336, "ref": "T", "alt": "I", "id": "T2336I", "cancers": ["breast", "pancreatic"], "freq": 0.01, "driver": True,
     "desc": "Missense in DNA-binding domain. Impairs RAD51 loading onto ssDNA."},
    {"pos": 3036, "ref": "D", "alt": "E", "id": "D3036E", "cancers": ["breast"], "freq": 0.008, "driver": True,
     "desc": "Located in OB-fold domain. Affects ssDNA binding affinity."},
    {"pos": 2723, "ref": "D", "alt": "H", "id": "D2723H", "cancers": ["breast", "ovarian"], "freq": 0.02, "driver": True,
     "desc": "DNA-binding domain mutation. Disrupts interaction with DSS1 protein."},
    {"pos": 1420, "ref": "E", "alt": "Q", "id": "E1420Q", "cancers": ["breast", "prostate"], "freq": 0.01, "driver": True,
     "desc": "Affects PALB2 interaction region. Impairs BRCA complex formation."},
    {"pos": 886, "ref": "E", "alt": "-", "id": "E886del", "cancers": ["breast", "ovarian"], "freq": 0.01, "driver": True,
     "desc": "In-frame deletion. Affects BRC repeat region critical for RAD51 binding."},
    {"pos": 2066, "ref": "K", "alt": "E", "id": "K2066E", "cancers": ["breast"], "freq": 0.005, "driver": False,
     "desc": "Variant of uncertain significance. Conservative amino acid change."},
    {"pos": 3052, "ref": "N", "alt": "S", "id": "N3052S", "cancers": ["breast"], "freq": 0.003, "driver": False,
     "desc": "Likely benign. Located near C-terminal domain."},
]

KRAS_MUTATIONS = [
    {"pos": 12, "ref": "G", "alt": "D", "id": "G12D", "cancers": ["pancreatic", "colorectal", "lung"], "freq": 0.12, "driver": True,
     "desc": "Most common KRAS mutation. Locks GTPase in active state. Major drug target."},
    {"pos": 12, "ref": "G", "alt": "V", "id": "G12V", "cancers": ["pancreatic", "lung"], "freq": 0.08, "driver": True,
     "desc": "Second most common at codon 12. Constitutive RAS signaling activation."},
    {"pos": 12, "ref": "G", "alt": "C", "id": "G12C", "cancers": ["lung"], "freq": 0.07, "driver": True,
     "desc": "Smoking-associated mutation. Target of sotorasib — first approved KRAS inhibitor."},
    {"pos": 12, "ref": "G", "alt": "A", "id": "G12A", "cancers": ["pancreatic", "colorectal"], "freq": 0.03, "driver": True,
     "desc": "Less common codon 12 variant. Similar oncogenic mechanism to G12D."},
    {"pos": 12, "ref": "G", "alt": "R", "id": "G12R", "cancers": ["pancreatic"], "freq": 0.02, "driver": True,
     "desc": "Enriched in pancreatic ductal adenocarcinoma. Distinct signaling profile."},
    {"pos": 13, "ref": "G", "alt": "D", "id": "G13D", "cancers": ["colorectal", "lung"], "freq": 0.05, "driver": True,
     "desc": "Codon 13 hotspot. May respond to anti-EGFR therapy unlike codon 12 mutations."},
    {"pos": 61, "ref": "Q", "alt": "H", "id": "Q61H", "cancers": ["lung", "pancreatic"], "freq": 0.03, "driver": True,
     "desc": "Codon 61 mutation. Impairs GTPase activity. Found in lung adenocarcinoma."},
    {"pos": 61, "ref": "Q", "alt": "L", "id": "Q61L", "cancers": ["lung", "skin"], "freq": 0.02, "driver": True,
     "desc": "Activating mutation at switch II region. Rare but clinically significant."},
    {"pos": 146, "ref": "A", "alt": "T", "id": "A146T", "cancers": ["colorectal"], "freq": 0.02, "driver": True,
     "desc": "Non-hotspot activating mutation. Enriched in colorectal cancer."},
    {"pos": 117, "ref": "K", "alt": "N", "id": "K117N", "cancers": ["colorectal"], "freq": 0.005, "driver": False,
     "desc": "Rare variant. Uncertain oncogenic significance."},
]

BRAF_MUTATIONS = [
    {"pos": 600, "ref": "V", "alt": "E", "id": "V600E", "cancers": ["skin", "colorectal", "lung", "brain"], "freq": 0.15, "driver": True,
     "desc": "Most common BRAF mutation (~90%). Constitutive kinase activation. Target of vemurafenib."},
    {"pos": 600, "ref": "V", "alt": "K", "id": "V600K", "cancers": ["skin"], "freq": 0.03, "driver": True,
     "desc": "Second most common V600 variant. Responds to BRAF inhibitor combinations."},
    {"pos": 601, "ref": "K", "alt": "E", "id": "K601E", "cancers": ["skin", "ovarian"], "freq": 0.02, "driver": True,
     "desc": "Non-V600 activating mutation. Intermediate kinase activity."},
    {"pos": 597, "ref": "L", "alt": "V", "id": "L597V", "cancers": ["skin", "lung"], "freq": 0.01, "driver": True,
     "desc": "Rare activating mutation in kinase domain. Variable drug sensitivity."},
    {"pos": 469, "ref": "G", "alt": "A", "id": "G469A", "cancers": ["lung", "colorectal", "skin"], "freq": 0.02, "driver": True,
     "desc": "P-loop mutation. Moderate kinase activation. Found in lung adenocarcinoma."},
    {"pos": 466, "ref": "G", "alt": "V", "id": "G466V", "cancers": ["lung", "colorectal"], "freq": 0.01, "driver": True,
     "desc": "Impaired kinase — signals through CRAF. Paradox activator of MAPK pathway."},
    {"pos": 594, "ref": "D", "alt": "G", "id": "D594G", "cancers": ["lung", "colorectal"], "freq": 0.01, "driver": True,
     "desc": "Kinase-dead mutation. Activates MAPK through CRAF dimerization."},
    {"pos": 464, "ref": "G", "alt": "E", "id": "G464E", "cancers": ["colorectal"], "freq": 0.005, "driver": False,
     "desc": "Variant of uncertain significance in P-loop region."},
]

PIK3CA_MUTATIONS = [
    {"pos": 1047, "ref": "H", "alt": "R", "id": "H1047R", "cancers": ["breast", "colorectal", "lung", "brain"], "freq": 0.10, "driver": True,
     "desc": "Most common PIK3CA hotspot. Kinase domain mutation. Constitutive PI3K activation."},
    {"pos": 545, "ref": "E", "alt": "K", "id": "E545K", "cancers": ["breast", "colorectal", "bladder"], "freq": 0.08, "driver": True,
     "desc": "Helical domain hotspot. Disrupts inhibitory contact with p85 regulatory subunit."},
    {"pos": 542, "ref": "E", "alt": "K", "id": "E542K", "cancers": ["breast", "colorectal", "bladder"], "freq": 0.06, "driver": True,
     "desc": "Helical domain mutation. Constitutive lipid kinase activity. Common in breast cancer."},
    {"pos": 1047, "ref": "H", "alt": "L", "id": "H1047L", "cancers": ["breast", "lung"], "freq": 0.02, "driver": True,
     "desc": "Alternative kinase domain hotspot. Similar activation mechanism to H1047R."},
    {"pos": 345, "ref": "N", "alt": "K", "id": "N345K", "cancers": ["breast", "liver"], "freq": 0.01, "driver": True,
     "desc": "C2 domain mutation. Alters membrane binding. Emerging therapeutic target."},
    {"pos": 420, "ref": "C", "alt": "R", "id": "C420R", "cancers": ["breast", "brain"], "freq": 0.01, "driver": True,
     "desc": "C2 domain mutation. Enhances membrane recruitment and PI3K signaling."},
    {"pos": 546, "ref": "E", "alt": "K", "id": "E546K", "cancers": ["bladder", "liver"], "freq": 0.01, "driver": True,
     "desc": "Helical domain mutation near E545K. Activates downstream AKT signaling."},
    {"pos": 726, "ref": "S", "alt": "F", "id": "S726F", "cancers": ["esophageal", "liver"], "freq": 0.008, "driver": True,
     "desc": "Located between helical and kinase domains. Moderate oncogenic activity."},
    {"pos": 1049, "ref": "G", "alt": "R", "id": "G1049R", "cancers": ["breast", "ovarian"], "freq": 0.01, "driver": True,
     "desc": "Near H1047 hotspot. Activating mutation in kinase domain."},
    {"pos": 866, "ref": "M", "alt": "V", "id": "M866V", "cancers": ["breast"], "freq": 0.003, "driver": False,
     "desc": "Variant of uncertain significance. Conservative amino acid substitution."},
]

EGFR_MUTATIONS = [
    {"pos": 858, "ref": "L", "alt": "R", "id": "L858R", "cancers": ["lung"], "freq": 0.12, "driver": True,
     "desc": "Most common EGFR mutation in lung cancer. Activates kinase domain. Responds to erlotinib/gefitinib."},
    {"pos": 790, "ref": "T", "alt": "M", "id": "T790M", "cancers": ["lung"], "freq": 0.06, "driver": True,
     "desc": "Gatekeeper mutation causing resistance to first-gen TKIs. Target of osimertinib."},
    {"pos": 746, "ref": "E", "alt": "-", "id": "E746del", "cancers": ["lung"], "freq": 0.08, "driver": True,
     "desc": "Exon 19 deletion. Second most common EGFR mutation. Highly TKI-sensitive."},
    {"pos": 719, "ref": "G", "alt": "S", "id": "G719S", "cancers": ["lung"], "freq": 0.02, "driver": True,
     "desc": "Uncommon activating mutation in P-loop. Moderate TKI sensitivity."},
    {"pos": 861, "ref": "L", "alt": "Q", "id": "L861Q", "cancers": ["lung"], "freq": 0.02, "driver": True,
     "desc": "Uncommon kinase domain mutation. Responds to afatinib and osimertinib."},
    {"pos": 768, "ref": "S", "alt": "I", "id": "S768I", "cancers": ["lung"], "freq": 0.01, "driver": True,
     "desc": "Exon 20 point mutation. Variable drug sensitivity. Often co-occurs with other mutations."},
    {"pos": 289, "ref": "A", "alt": "V", "id": "A289V", "cancers": ["brain"], "freq": 0.03, "driver": True,
     "desc": "Extracellular domain mutation. Common in glioblastoma (GBM). Constitutive activation."},
    {"pos": 598, "ref": "R", "alt": "V", "id": "R108K", "cancers": ["lung", "esophageal"], "freq": 0.01, "driver": True,
     "desc": "Extracellular domain variant. Found in esophageal squamous cell carcinoma."},
    {"pos": 1210, "ref": "A", "alt": "V", "id": "A1210V", "cancers": ["lung"], "freq": 0.003, "driver": False,
     "desc": "C-terminal variant. Uncertain clinical significance."},
]

PTEN_MUTATIONS = [
    {"pos": 130, "ref": "R", "alt": "G", "id": "R130G", "cancers": ["prostate", "brain", "breast"], "freq": 0.05, "driver": True,
     "desc": "Most common PTEN hotspot. Disrupts phosphatase catalytic site. Loss of tumor suppression."},
    {"pos": 130, "ref": "R", "alt": "Q", "id": "R130Q", "cancers": ["prostate", "brain"], "freq": 0.03, "driver": True,
     "desc": "Alternative catalytic site mutation. Abolishes lipid phosphatase activity."},
    {"pos": 173, "ref": "R", "alt": "C", "id": "R173C", "cancers": ["brain", "prostate", "liver"], "freq": 0.03, "driver": True,
     "desc": "C2 domain mutation. Disrupts membrane binding. Common in glioblastoma."},
    {"pos": 233, "ref": "C", "alt": "X", "id": "C233X", "cancers": ["prostate", "breast"], "freq": 0.02, "driver": True,
     "desc": "Nonsense mutation causing premature stop. Complete loss of PTEN function."},
    {"pos": 136, "ref": "C", "alt": "R", "id": "C136R", "cancers": ["brain", "prostate"], "freq": 0.02, "driver": True,
     "desc": "Near catalytic site. Disrupts protein stability and phosphatase activity."},
    {"pos": 234, "ref": "K", "alt": "N", "id": "K234N", "cancers": ["esophageal", "prostate"], "freq": 0.01, "driver": True,
     "desc": "C2 domain mutation. Impairs membrane localization of PTEN."},
    {"pos": 42, "ref": "G", "alt": "V", "id": "G42V", "cancers": ["prostate", "bladder"], "freq": 0.01, "driver": True,
     "desc": "N-terminal phosphatase domain. Reduces catalytic efficiency."},
    {"pos": 317, "ref": "L", "alt": "R", "id": "L317R", "cancers": ["brain", "skin"], "freq": 0.01, "driver": True,
     "desc": "C2 domain mutation. Affects PTEN stability and nuclear localization."},
    {"pos": 335, "ref": "T", "alt": "I", "id": "T335I", "cancers": ["prostate"], "freq": 0.005, "driver": False,
     "desc": "C-terminal variant. Uncertain significance. Possible effect on protein stability."},
]

ALL_GENES = {
    "TP53": {"mutations": TP53_MUTATIONS, "length": 393, "chromosome": "17p13.1",
             "full_name": "Tumor Protein P53", "role": "Tumor suppressor — 'Guardian of the Genome'"},
    "BRCA1": {"mutations": BRCA1_MUTATIONS, "length": 1863, "chromosome": "17q21.31",
              "full_name": "Breast Cancer Gene 1", "role": "DNA repair via homologous recombination"},
    "BRCA2": {"mutations": BRCA2_MUTATIONS, "length": 3418, "chromosome": "13q13.1",
              "full_name": "Breast Cancer Gene 2", "role": "RAD51-mediated DNA double-strand break repair"},
    "KRAS": {"mutations": KRAS_MUTATIONS, "length": 189, "chromosome": "12p12.1",
             "full_name": "KRAS Proto-Oncogene", "role": "GTPase signal transducer — RAS/MAPK pathway"},
    "BRAF": {"mutations": BRAF_MUTATIONS, "length": 766, "chromosome": "7q34",
             "full_name": "B-Raf Proto-Oncogene", "role": "Serine/threonine kinase — MAPK/ERK pathway"},
    "PIK3CA": {"mutations": PIK3CA_MUTATIONS, "length": 1068, "chromosome": "3q26.32",
               "full_name": "PI3K Catalytic Subunit Alpha", "role": "Lipid kinase — PI3K/AKT/mTOR pathway"},
    "EGFR": {"mutations": EGFR_MUTATIONS, "length": 1210, "chromosome": "7p11.2",
             "full_name": "Epidermal Growth Factor Receptor", "role": "Receptor tyrosine kinase — EGFR signaling"},
    "PTEN": {"mutations": PTEN_MUTATIONS, "length": 403, "chromosome": "10q23.31",
             "full_name": "Phosphatase and Tensin Homolog", "role": "Tumor suppressor — PI3K/AKT pathway antagonist"},
}

CANCER_TYPES = ["breast", "colorectal", "ovarian", "lung", "brain", "liver",
                "pancreatic", "bladder", "skin", "esophageal", "prostate"]


def generate_mutation_catalog():
    """Save the full mutation catalog as JSON for the frontend."""
    catalog = {}
    for gene_name, gene_data in ALL_GENES.items():
        catalog[gene_name] = {
            "length": gene_data["length"],
            "chromosome": gene_data["chromosome"],
            "full_name": gene_data["full_name"],
            "role": gene_data["role"],
            "mutations": gene_data["mutations"],
        }
    return catalog


def generate_training_data(num_samples=2000):
    """Generate training samples: mutation profiles -> cancer type."""
    # Build a flat list of all driver mutations with IDs
    all_driver_muts = []
    for gene_name, gene_data in ALL_GENES.items():
        for mut in gene_data["mutations"]:
            if mut["driver"]:
                all_driver_muts.append({"gene": gene_name, **mut})

    feature_names = [f"{m['gene']}_{m['id']}" for m in all_driver_muts]
    samples = []

    for _ in range(num_samples):
        # Pick a cancer type
        cancer = random.choice(CANCER_TYPES)

        # Build mutation profile — mutations associated with this cancer are more likely present
        features = []
        for mut in all_driver_muts:
            if cancer in mut["cancers"]:
                # Boost: mutations strongly associated with this cancer
                # Extra boost if this cancer is the ONLY one listed (exclusive) or first (primary)
                if len(mut["cancers"]) == 1 and mut["cancers"][0] == cancer:
                    prob = min(0.9, mut["freq"] * 15 + 0.45)
                elif mut["cancers"][0] == cancer:
                    prob = min(0.8, mut["freq"] * 12 + 0.3)
                else:
                    prob = min(0.45, mut["freq"] * 4 + 0.1)
            else:
                # Very low background rate for non-associated mutations
                prob = mut["freq"] * 0.08
            features.append(1 if random.random() < prob else 0)

        # Only keep samples with at least 1 mutation
        if sum(features) == 0:
            features[random.randint(0, len(features) - 1)] = 1

        samples.append({"features": features, "cancer": cancer})

    return samples, feature_names


def main():
    random.seed(42)
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, "..", "..", "data")
    os.makedirs(data_dir, exist_ok=True)

    # Save mutation catalog
    catalog = generate_mutation_catalog()
    catalog_path = os.path.join(data_dir, "mutation_catalog.json")
    with open(catalog_path, "w") as f:
        json.dump(catalog, f, indent=2)
    print(f"Mutation catalog saved -> {catalog_path}")
    print(f"  Genes: {list(catalog.keys())}")
    for g, d in catalog.items():
        print(f"  {g}: {len(d['mutations'])} mutations, {d['length']} aa, chr {d['chromosome']}")

    # Generate training data
    samples, feature_names = generate_training_data(5000)
    training_path = os.path.join(data_dir, "training_data.csv")

    with open(training_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(feature_names + ["cancer_type"])
        for s in samples:
            writer.writerow(s["features"] + [s["cancer"]])

    # Distribution
    from collections import Counter
    dist = Counter(s["cancer"] for s in samples)
    print(f"\nTraining data saved -> {training_path}")
    print(f"  {len(samples)} samples, {len(feature_names)} features")
    print(f"  Cancer distribution: {dict(sorted(dist.items()))}")


if __name__ == "__main__":
    main()
