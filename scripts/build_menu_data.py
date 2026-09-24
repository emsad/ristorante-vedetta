"""Build the draft menu data from the two supplied Vedetta PDFs.

The summer dishes are transcribed by their price groups after visual review.
Wine rows are read from the printed PDF; their wording and prices still require
final confirmation from the restaurant before a public launch.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "dist" / "assets"
OUT = ROOT / "dist" / "menus.json"
SHEET_TEMPLATE = ROOT / "menu-sheet-template.csv"


def dish(name: str, price: str, description: str = "") -> dict[str, str]:
    return {"name": name, "price": price, "description": description}


summer = {
    "title": "Menu estivo",
    "pdf": "/assets/menu-estivo.pdf",
    "groups": [
        {"name": "Antipasti", "items": [
            dish("Prosciutto crudo di Parma e melone", "14 €"),
            dish("Bresaola della Valtellina con rucola e grana", "14 €"),
            dish("Affettato misto", "14 €"),
            dish("Carpaccio di filetto di manzo con funghi porcini", "18 €"),
            dish("Carpaccio di salmone scozzese affumicato", "18 €"),
            dish("Vitello tonnato", "18 €"),
        ]},
        {"name": "Primi", "items": [
            dish("Tortelloni di zucca alla mantovana", "12 €"),
            dish("Tortelloni di ricotta e spinaci", "12 €"),
            dish("Casoncelli al burro versato e salvia", "12 €"),
            dish("Tagliatelle ai funghi porcini", "15 €"),
            dish("Trittico della casa", "15 €", "Tagliatelle ai funghi porcini, tortelloni di ricotta e spinaci, ravioli alla panna"),
        ]},
        {"name": "Dalla brace", "items": [
            dish("Filetto di manzo", "24 €"),
            dish("Filetto di cavallo", "24 €"),
            dish("Bistecca di filetto di cavallo", "24 €"),
            dish("Tagliata di manzo argentino", "22 €"),
            dish("Costata di manzo irlandese", "22 €"),
            dish("Fiorentina di manzo", "50 € / kg"),
            dish("Grigliata mista", "18 €", "Pollo, salamina, costine e formaggio fuso"),
            dish("Pollo ai ferri con patate", "12 €"),
        ]},
        {"name": "Dalla cucina", "items": [
            dish("Filetto di manzo al pepe verde flambato al Cognac", "25 €"),
            dish("Piatto del Roncher", "18 €", "Formaggio fuso, funghi porcini trifolati e polenta"),
            dish("Scaloppine con funghi porcini e polenta", "20 €"),
            dish("Fungo porcino impanato o trifolato", "20 €"),
            dish("Formaggio fuso", "10 €"),
        ]},
        {"name": "Contorni", "items": [
            dish("Funghi porcini trifolati", "10 €"),
            dish("Insalata mista", "7 €"),
            dish("Verdure grigliate", "7 €"),
            dish("Patate al forno", "7 €"),
            dish("Patate fritte", "7 €"),
        ]},
        {"name": "Dolci", "items": [
            dish("Frutti di bosco", "9 €"),
            dish("Torte e dolci", "9 €"),
        ]},
    ],
}


WINE_GROUP_ORDER = [
    "Vini bianchi", "Vini rosati", "Vini bianchi esteri", "Bianchi al bicchiere",
    "Vini da dessert", "Le bolle", "Vini rossi", "Vini rossi esteri", "Rossi al bicchiere",
]


def read_wines() -> list[dict]:
    reader = PdfReader(ASSETS / "carta-vini.pdf")
    groups: dict[str, list[dict[str, str]]] = {name: [] for name in WINE_GROUP_ORDER}
    price_pattern = re.compile(r"^(.*?)\s*\.{1,}\s*(\d+)\s*€\s*$")

    # The InDesign text stream repeats headings and places the two red-wine
    # sidebars before the regional columns. These maps preserve the printed
    # categories without relying on positional inference.
    page2_markers = {
        "VINI BIANCHI": ("Vini bianchi", ""),
        "TRENTINO ALTO ADIGE": ("Vini bianchi", "Trentino Alto Adige"),
        "LOMBARDIA": ("Vini bianchi", "Lombardia"),
        "FRIULI VENEZIA GIULIA": ("Vini bianchi", "Friuli Venezia Giulia"),
        "LIGURIA": ("Vini bianchi", "Liguria"),
        "SICILIA": ("Vini bianchi", "Sicilia"),
        "VINI ROSATI": ("Vini rosati", ""),
        "VINI BIANCHI ESTERI": ("Vini bianchi esteri", ""),
        "VINI BIANCHI AL BICCHIERE": ("Bianchi al bicchiere", ""),
        "VINI DA DESSERT": ("Vini da dessert", ""),
        "METODO CHARMAT": ("Le bolle", "Metodo Charmat"),
        "METODO CLASSICO FRANCIACORTA": ("Le bolle", "Franciacorta"),
        "CHAMPAGNE": ("Le bolle", "Champagne e Crémant"),
    }
    page3_markers = {
        "VINI ROSSI ESTERI": ("Vini rossi esteri", ""),
        "VINI ROSSI AL BICCHIERE": ("Rossi al bicchiere", ""),
        "TRENTINO ALTO ADIGE": ("Vini rossi", "Trentino Alto Adige"),
        "FRIULI VENEZIA GIULIA": ("Vini rossi", "Friuli Venezia Giulia"),
        "PIEMONTE": ("Vini rossi", "Piemonte"),
        "LOMBARDIA": ("Vini rossi", "Lombardia"),
        "VENETO": ("Vini rossi", "Veneto"),
        "LIGURIA": ("Vini rossi", "Liguria"),
        "TOSCANA": ("Vini rossi", "Toscana"),
        "EMILIA ROMAGNA": ("Vini rossi", "Emilia Romagna"),
        "MARCHE - UMBRIA": ("Vini rossi", "Marche e Umbria"),
        "PUGLIA": ("Vini rossi", "Puglia"),
        "SICILIA": ("Vini rossi", "Sicilia"),
    }

    for page_index, markers in [(1, page2_markers), (2, page3_markers)]:
        group = ""
        region = ""
        pending = ""
        for raw_line in reader.pages[page_index].extract_text().splitlines():
            line = raw_line.strip()
            if not line or line.startswith("Vedetta •"):
                continue
            if line in ("LE BOLLE", "VINI ROSSIVINI ROSSI"):
                continue
            marker = next((key for key in markers if line == key + key), None)
            if marker:
                group, region = markers[marker]
                pending = ""
                continue
            match = price_pattern.match(line)
            if match and group:
                name = match.group(1).strip(" .")
                if pending:
                    name = f"{pending} {name}"
                    pending = ""
                name = re.sub(r"\s+", " ", name)
                groups[group].append(dish(name, f"{match.group(2)} €", region))
            elif group and not "€" in line and not line.endswith(".indd"):
                pending = line.strip(" .")

    return [{"name": name, "items": groups[name]} for name in WINE_GROUP_ORDER]


def main() -> None:
    wines = {"title": "Carta dei vini", "pdf": "/assets/carta-vini.pdf", "groups": read_wines()}
    data = {
        "estivo": summer,
        "invernale": {"title": "Menu invernale", "groups": [], "pending": "Il menu invernale sarà inserito quando ci fornirai la carta aggiornata."},
        "vini": wines,
        "liquori": {"title": "Carta dei liquori", "groups": [], "pending": "La carta dei liquori sarà inserita dopo aver ricevuto il menu e i prezzi."},
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with SHEET_TEMPLATE.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["carta", "categoria", "nome", "descrizione", "prezzo", "ordine", "visibile"])
        for menu_id in ("estivo", "vini"):
            position = 0
            for group in data[menu_id]["groups"]:
                for item in group["items"]:
                    position += 1
                    writer.writerow([menu_id, group["name"], item["name"], item["description"], item["price"], position, "SI"])
    print(f"Menu estivo: {sum(len(group['items']) for group in summer['groups'])} voci")
    print(f"Carta dei vini: {sum(len(group['items']) for group in wines['groups'])} voci")


if __name__ == "__main__":
    main()
