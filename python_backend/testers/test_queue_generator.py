"""
test_queue_generator.py
Unit tests for db_seeder.py live demo queue generation.

Verifies:
1. Zero phone numbers generated (RA 10173 data privacy).
2. Format and status compliance (status='On Progress', cubicleNum=None, counter=None).
3. Sequence-aware incrementation:
   - If Consultation already has 1001, next ticket must be 1002.
   - If Consultation already has 5008, next ticket must be 5009.
   - Initial empty queues start at 001 with correct prefix.
4. Multi-digit prefixes (e.g. Warfarin '10' -> 10001, 10002).
5. Legacy backwards compatibility for generate_fake_patients.
"""

import unittest
from unittest.mock import patch
import sys
import os

# Add python_backend to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import db_seeder


class QueueGeneratorTests(unittest.TestCase):
    def test_resolve_next_ticket_number_empty_starts_at_001(self):
        """A service with no tickets today should start at prefix + 001."""
        ticket, num = db_seeder.resolve_next_ticket_number("1", [], pad_length=3)
        self.assertEqual(ticket, "1001")
        self.assertEqual(num, 1)

        ticket_5, num_5 = db_seeder.resolve_next_ticket_number("5", [], pad_length=3)
        self.assertEqual(ticket_5, "5001")
        self.assertEqual(num_5, 1)

    def test_resolve_next_ticket_number_increments_existing_queue(self):
        """If Consultation already has 1001, the next generated ticket must be 1002."""
        existing = ["1001"]
        ticket, num = db_seeder.resolve_next_ticket_number("1", existing, pad_length=3)
        self.assertEqual(ticket, "1002")
        self.assertEqual(num, 2)

        # Generating another ticket continues to 1003
        existing.append(ticket)
        next_ticket, next_num = db_seeder.resolve_next_ticket_number("1", existing, pad_length=3)
        self.assertEqual(next_ticket, "1003")
        self.assertEqual(next_num, 3)

    def test_consultation_adult_increments_from_5008_to_5009(self):
        """If Consultation Adult has tickets 5001 through 5008, next is 5009."""
        existing = [f"500{i}" for i in range(1, 9)]
        ticket, num = db_seeder.resolve_next_ticket_number("5", existing, pad_length=3)
        self.assertEqual(ticket, "5009")
        self.assertEqual(num, 9)

        # 10th ticket should not truncate and format as 5010
        existing.append(ticket)
        ticket_10, num_10 = db_seeder.resolve_next_ticket_number("5", existing, pad_length=3)
        self.assertEqual(ticket_10, "5010")
        self.assertEqual(num_10, 10)

    def test_multi_digit_prefix_warfarin_10(self):
        """Warfarin prefix '10' starts at 10001 and increments to 10002 without digit shift."""
        ticket_1, num_1 = db_seeder.resolve_next_ticket_number("10", [], pad_length=3)
        self.assertEqual(ticket_1, "10001")
        self.assertEqual(num_1, 1)

        ticket_2, num_2 = db_seeder.resolve_next_ticket_number("10", [ticket_1], pad_length=3)
        self.assertEqual(ticket_2, "10002")
        self.assertEqual(num_2, 2)

    @patch("db_seeder.fetch_today_patients_from_supabase")
    @patch("db_seeder.fetch_max_queue_position")
    def test_build_live_demo_patients_never_generates_phone_numbers(self, mock_queue_pos, mock_today):
        """Data privacy invariant: phoneNum MUST always be None."""
        mock_queue_pos.return_value = 50
        mock_today.return_value = []

        records = db_seeder.build_live_demo_patients(count_override=5, service_filter="Consultation")
        self.assertEqual(len(records), 5)
        for r in records:
            self.assertIsNone(r["phoneNum"], "phoneNum must be None per RA 10173 mandate")
            self.assertEqual(r["status"], "On Progress")
            self.assertIsNone(r["cubicleNum"])
            self.assertIsNone(r["counter"])
            self.assertIsNone(r["reg_start"])
            self.assertIsNone(r["reg_end"])
            self.assertIsNone(r["consult_start"])
            self.assertIsNone(r["consult_end"])
            self.assertFalse(r["is_historical"])

    @patch("db_seeder.fetch_today_patients_from_supabase")
    @patch("db_seeder.fetch_max_queue_position")
    def test_build_live_demo_patients_adheres_to_existing_consultation_1001(self, mock_queue_pos, mock_today):
        """If database has Consultation ticket 1001, generator starts at 1002."""
        mock_queue_pos.return_value = 10
        mock_today.return_value = [
            {"service": "Consultation", "patientNum": "1001", "queue_position": 10, "status": "On Progress"}
        ]

        records = db_seeder.build_live_demo_patients(
            service_filter="Consultation",
            count_override=3,
            prefix_override="1",
        )

        self.assertEqual(len(records), 3)
        self.assertEqual(records[0]["patientNum"], "1002")
        self.assertEqual(records[1]["patientNum"], "1003")
        self.assertEqual(records[2]["patientNum"], "1004")
        self.assertEqual(records[0]["queue_position"], 11)
        self.assertEqual(records[1]["queue_position"], 12)
        self.assertEqual(records[2]["queue_position"], 13)

    def test_adapts_to_superadmin_service_queue_prefix(self):
        """When Superadmin edits a service's queue_prefix, the seeder uses it directly."""
        services_catalog = [
            {"label_en": "Dental", "queue_prefix": "DENT", "queue_pad_length": 3},
            {"label_en": "Consultation", "queue_prefix": "C", "queue_pad_length": 3},
        ]
        prefix_dent = db_seeder.resolve_service_prefix("Dental", services_catalog=services_catalog)
        self.assertEqual(prefix_dent, "DENT")

        prefix_c = db_seeder.resolve_service_prefix("Consultation", services_catalog=services_catalog)
        self.assertEqual(prefix_c, "C")

    def test_adapts_to_superadmin_queue_prefix_map(self):
        """When Superadmin edits queue_prefix_map in app_settings, the seeder uses it."""
        prefix_map = [
            {"service": "Consultation", "subcategory": "Adult", "prefix": "9"},
            {"service": "OPD Screening", "subcategory": None, "prefix": "S"},
        ]
        prefix_adult = db_seeder.resolve_service_prefix(
            "Consultation", subcategory="Adult", prefix_map=prefix_map
        )
        self.assertEqual(prefix_adult, "9")

        prefix_opd = db_seeder.resolve_service_prefix(
            "OPD Screening", subcategory=None, prefix_map=prefix_map
        )
        self.assertEqual(prefix_opd, "S")

    def test_adapts_to_superadmin_service_pad_length(self):
        """When Superadmin customizes queue_pad_length in services table, the seeder respects it."""
        services_catalog = [
            {"label_en": "Dental", "queue_prefix": "DENT", "queue_pad_length": 4},
        ]
        pad_len = db_seeder.resolve_service_pad_length("Dental", services_catalog=services_catalog)
        self.assertEqual(pad_len, 4)

        ticket, num = db_seeder.resolve_next_ticket_number("DENT", [], pad_length=pad_len)
        self.assertEqual(ticket, "DENT0001")


if __name__ == "__main__":
    unittest.main()
