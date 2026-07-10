-- Idempotent demo seed: approved candidates + open election phase for audits.
-- Safe to re-run (ON CONFLICT DO NOTHING / conditional updates).

UPDATE public.election_cycles
SET phase = 'open', updated_at = now()
WHERE slug = 'mykdm-2026' AND phase <> 'open';

INSERT INTO public.candidates (
  id,
  full_name,
  national_id,
  iebc_voter_number,
  phone,
  tier,
  position_id,
  position_title,
  election_cycle_id,
  county,
  constituency,
  ward,
  slogan,
  bio,
  status,
  certificate_number,
  certified_at
)
SELECT
  v.id::uuid,
  v.full_name,
  v.national_id,
  v.iebc_voter_number,
  v.phone,
  v.tier::public.candidate_tier,
  v.position_id,
  p.title,
  c.id,
  v.county,
  v.constituency,
  v.ward,
  v.slogan,
  v.bio,
  'approved'::public.candidate_status,
  v.certificate_number,
  now()
FROM public.election_cycles c
CROSS JOIN (
  VALUES
    ('c1000001-0000-4000-8000-000000000001', 'David Mbehi', '10000001', 'IEBC-10001', '+254700000001', 'national', 'national-chair', 'Nairobi', NULL::text, NULL::text, 'Kutoka Ground Hadi Top', 'Founding member of MY-KDM.', 'MYKDM-CERT-0001'),
    ('c1000001-0000-4000-8000-000000000002', 'Amina Yusuf', '10000002', 'IEBC-10002', '+254700000002', 'national', 'national-chair', 'Mombasa', NULL, NULL, 'One Movement, One Voice', 'Coast regional coordinator.', 'MYKDM-CERT-0002'),
    ('c1000001-0000-4000-8000-000000000003', 'Kipchoge Ruto', '10000003', 'IEBC-10003', '+254700000003', 'national', 'national-chair', 'Uasin Gishu', NULL, NULL, 'Serious youth, serious results', 'Ex-USLA chair.', 'MYKDM-CERT-0003'),
    ('c1000001-0000-4000-8000-000000000004', 'Maloba Wanjala', '10000004', 'IEBC-10004', '+254700000004', 'national', 'national-ceo', 'Bungoma', NULL, NULL, 'Delivery over noise', 'Operations lead with USLA.', 'MYKDM-CERT-0004'),
    ('c1000001-0000-4000-8000-000000000005', 'Faith Nyambura', '10000005', 'IEBC-10005', '+254700000005', 'national', 'national-ceo', 'Nyeri', NULL, NULL, 'Systems that scale', 'Product and operations background.', 'MYKDM-CERT-0005'),
    ('c1000001-0000-4000-8000-000000000006', 'Brian Otieno', '10000006', 'IEBC-10006', '+254700000006', 'national', 'minister-enterprise', 'Siaya', NULL, NULL, 'Jobs, not slogans', 'Runs a jua-kali cooperative.', 'MYKDM-CERT-0006'),
    ('c1000001-0000-4000-8000-000000000007', 'Zawadi Mwikali', '10000007', 'IEBC-10007', '+254700000007', 'national', 'minister-enterprise', 'Machakos', NULL, NULL, 'Capital to the mashinani', 'Rural fintech pilot founder.', 'MYKDM-CERT-0007'),
    ('c1000001-0000-4000-8000-000000000008', 'Dr. Aisha Noor', '10000008', 'IEBC-10008', '+254700000008', 'national', 'minister-health', 'Garissa', NULL, NULL, 'Healthy youth, healthy nation', 'Medical officer and mental health advocate.', 'MYKDM-CERT-0008'),
    ('c1000001-0000-4000-8000-000000000009', 'Kevin Kimani', '10000009', 'IEBC-10009', '+254700000009', 'national', 'minister-health', 'Kiambu', NULL, NULL, 'Mental health is a mashinani issue', 'Public health researcher.', 'MYKDM-CERT-0009'),
    ('c1000001-0000-4000-8000-000000000010', 'Wanjiru Kariuki', '10000010', 'IEBC-10010', '+254700000010', 'county', 'governor-nairobi', 'Nairobi', NULL, NULL, 'Nairobi youth, unignorable', 'Community organiser across Eastlands.', 'MYKDM-CERT-0010'),
    ('c1000001-0000-4000-8000-000000000011', 'Juma Hassan', '10000011', 'IEBC-10011', '+254700000011', 'county', 'governor-nairobi', 'Nairobi', NULL, NULL, 'From Kibra to City Hall', 'Ward-level organiser.', 'MYKDM-CERT-0011'),
    ('c1000001-0000-4000-8000-000000000012', 'Achieng Odera', '10000012', 'IEBC-10012', '+254700000012', 'county', 'governor-nairobi', 'Nairobi', NULL, NULL, 'Digital-first governance', 'Civic-tech builder.', 'MYKDM-CERT-0012'),
    ('c1000001-0000-4000-8000-000000000013', 'Tom Ochieng', '10000013', 'IEBC-10013', '+254700000013', 'county', 'governor-kisumu', 'Kisumu', NULL, NULL, 'Kisumu forward', 'Boda-boda SACCO leader.', 'MYKDM-CERT-0013'),
    ('c1000001-0000-4000-8000-000000000014', 'Grace Adhiambo', '10000014', 'IEBC-10014', '+254700000014', 'county', 'governor-kisumu', 'Kisumu', NULL, NULL, 'Lake region rising', 'Youth vaccination drive lead.', 'MYKDM-CERT-0014'),
    ('c1000001-0000-4000-8000-000000000015', 'Peter Juma', '10000015', 'IEBC-10015', '+254700000015', 'ward', 'ward-kibra', 'Nairobi', 'Kibra', 'Laini saba', 'Kibra kwanza', 'Youth talent hub in Laini Saba.', 'MYKDM-CERT-0015'),
    ('c1000001-0000-4000-8000-000000000016', 'Mercy Achieng', '10000016', 'IEBC-10016', '+254700000016', 'ward', 'ward-kibra', 'Nairobi', 'Kibra', 'Laini saba', 'Sisters to the front', 'Mentorship circle organiser.', 'MYKDM-CERT-0016'),
    ('c1000001-0000-4000-8000-000000000017', 'Silas Otieno', '10000017', 'IEBC-10017', '+254700000017', 'ward', 'ward-kondele', 'Kisumu', 'Kisumu Central', 'Kondele', 'Kondele on the map', 'Community journalist.', 'MYKDM-CERT-0017'),
    ('c1000001-0000-4000-8000-000000000018', 'Linet Awuor', '10000018', 'IEBC-10018', '+254700000018', 'ward', 'ward-kondele', 'Kisumu', 'Kisumu Central', 'Kondele', 'Deliver, do not perform', 'Savings group organiser.', 'MYKDM-CERT-0018'),
    ('c1000001-0000-4000-8000-000000000019', 'Hussein Abdalla', '10000019', 'IEBC-10019', '+254700000019', 'constituency', 'constituency-kibra', 'Nairobi', 'Kibra', NULL, 'Wards first, always', 'Kibra ward reps caucus convener.', 'MYKDM-CERT-0019'),
    ('c1000001-0000-4000-8000-000000000020', 'Naliaka Wafula', '10000020', 'IEBC-10020', '+254700000020', 'constituency', 'constituency-kibra', 'Nairobi', 'Kibra', NULL, 'Kibra one voice', 'Community paralegal.', 'MYKDM-CERT-0020'),
    ('c1000001-0000-4000-8000-000000000021', 'Otieno Kajwang', '10000021', 'IEBC-10021', '+254700000021', 'constituency', 'constituency-kisumu-central', 'Kisumu', 'Kisumu Central', NULL, 'Central rising', 'Small trader organiser.', 'MYKDM-CERT-0021'),
    ('c1000001-0000-4000-8000-000000000022', 'Sharon Anyango', '10000022', 'IEBC-10022', '+254700000022', 'constituency', 'constituency-kisumu-central', 'Kisumu', 'Kisumu Central', NULL, 'Data-driven Kisumu', 'Data analyst turned organiser.', 'MYKDM-CERT-0022')
) AS v(id, full_name, national_id, iebc_voter_number, phone, tier, position_id, county, constituency, ward, slogan, bio, certificate_number)
JOIN public.positions p ON p.id = v.position_id
WHERE c.slug = 'mykdm-2026'
ON CONFLICT (id) DO NOTHING;
