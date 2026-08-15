# Impact Lab — Veri Setleri

Deprem Impact Lab (15 Ağustos 2026, QNBEYOND) katılımcıları için hazırlanmış tema bazlı veri paketi.
Amaç: takımların ilk saatlerini "veri nerede?" diye aramakla değil, **üretmekle** geçirmesi.

📁 **Tüm veri seti (Google Drive): <https://drive.google.com/drive/folders/1jjgednxPbgV7xWP4XaPL1lVNGDPmdGqo>**

> Dosyalar boyutları nedeniyle (toplam ~5.8 GB, tek bir dosya 2.8 GB) repoya konmadı;
> aşağıdaki tabloların tamamı doğrudan Drive'a link verir. İhtiyacın olanı indir, repoya sadece
> **işlediğin/türettiğin** veriyi ekle.

## Klasör yapısı
```
Impact Lab Veri Setleri/
├─ 00 - Ortak Veri (Tum Temalar)/   → sınırlar, metodoloji, kaynak kataloğu (her tema kullanır)
├─ Tema 1 - Deprem Oncesi (Before)/ → risk, exposure, mahalle karnesi, kırılganlık
├─ Tema 2 - Deprem Sirasi (During)/ → sismik feed, toplanma alanı, erken uyarı, offline
└─ Tema 3 - Deprem Sonrasi (After)/ → PDNA, barınma, hasar, sağlık tesisleri, saha raporları
```
Her klasörde bir **`KAYNAKLAR.md`** var: içindeki her dosyanın ne olduğu, formatı, nasıl kullanılacağı
ve **paketlenemeyen canlı kaynakların** (API/portal) linkleri.

## Öne çıkan hazır veriler (makine-okunur)

| Veri | Konum | Ne işe yarar |
|---|---|---|
| **Mahalle Deprem Karnesi** (972 mahalle × 12 metrik, CSV/JSON) | Tema 1 | Mahalle bazlı hasar/can kaybı/barınma — karne ürününün çekirdeği |
| **İstanbul ilçe sınırları** (GeoJSON + SHP) | 00-Ortak | Her harita ürününün baz katmanı |
| **AFAD + USGS deprem katalogları** (CSV/GeoJSON snapshot) | Tema 2 | Gerçek sismik olay geçmişi (Marmara) |
| **Toplanma alanları / Hastane / Eczane** (OSM GeoJSON) | Tema 2 / Tema 3 | Nokta konum katmanları |

---

## Dosyalar

### [00 - Ortak Veri (Tum Temalar)](https://drive.google.com/drive/folders/1WjSU8N1u8e-jkTQuFMQfgDaMmCRXcil6)

Sınırlar, metodoloji, kaynak kataloğu — her tema kullanır.

| Dosya | Boyut | Link |
|---|---:|---|
| DEZIM-Kandilli-Deprem-Hasar-Tahmin-Raporu-2019.pdf | 39 MB | [aç](https://drive.google.com/file/d/11MIx845EIY7dM6zUnDFSqZsa5F4Y0fWk/view) |
| Istanbul-Acik-Veri-Kaynak-Katalogu-Elicit.xlsx | 13 KB | [aç](https://drive.google.com/file/d/1peW8LlGZ1-20-YZi11Mdv3btyinVagoL/view) |
| Istanbul-Olasi-Deprem-Kayiplari-Guncelleme-Raporu-2010.pdf | 19 MB | [aç](https://drive.google.com/file/d/1LqYZ4HCL_C26zE2iTCafzPSdhemo5J2_/view) |
| KAYNAKLAR.md | 2 KB | [aç](https://drive.google.com/file/d/1B9ljgfYQMxI5_O_4ti9b3t02ODsIOgEz/view) |
| RYTEIE-2019-Riskli-Yapi-Tespit-Esaslari-(EK-A-metodoloji).pdf | 4 MB | [aç](https://drive.google.com/file/d/1tBrKBGyLdbKOlZAiz_8zrrmfZb5Fd0Ys/view) |

**📁 [Idari-Sinirlar (Istanbul)](https://drive.google.com/drive/folders/1nZHrc6zyfIxiOftY4dvuiEJ7jLyp-6k2)** — 8 dosya, 9 MB

| Dosya | Boyut | Link |
|---|---:|---|
| istanbul_ilceler.geojson | 659 KB | [aç](https://drive.google.com/file/d/1xrwuKuaKVMVh3iTtR6TNO_MVFSPOY43u/view) |
| README.md | 2 KB | [aç](https://drive.google.com/file/d/10EkhxdKeKKCCOGnu7iiTIZIUVYUmQc3t/view) |
| Turkiye_ilceler.cpg | 0 KB | [aç](https://drive.google.com/file/d/198HSY4FuDXM7t_bZyuF_5I5y6ZlL-o_-/view) |
| Turkiye_ilceler.dbf | 289 KB | [aç](https://drive.google.com/file/d/1OBWJ25Pthey-gJntFiWSdF_RLmbcObKe/view) |
| Turkiye_ilceler.prj | 0 KB | [aç](https://drive.google.com/file/d/1sgOTfG2SBQSkBw2e3zIBtyAy4XyEpblC/view) |
| Turkiye_ilceler.qmd | 1 KB | [aç](https://drive.google.com/file/d/1ZE2N_9xxOEjDcdlrynclNt0zcTjl6apH/view) |
| Turkiye_ilceler.shp | 8 MB | [aç](https://drive.google.com/file/d/1fUmELrLpxRtlH-zX2Ei0K2ECuRF2Golp/view) |
| Turkiye_ilceler.shx | 8 KB | [aç](https://drive.google.com/file/d/1moYE76bHKtEYHEpdNUAwOv70nMI1wDkl/view) |

**📁 [ilce_kitapciklari](https://drive.google.com/drive/folders/1EwXMfHlvvT5rMR141-PBdccVU11lKMGg)** — 40 dosya, 1.0 GB

<details><summary>40 dosyayı listele</summary>

| Dosya | Boyut | Link |
|---|---:|---|
| _urls.txt | 3 KB | [aç](https://drive.google.com/file/d/1tgwP9W7JPxJiTcHPC46bVPhjgZ9hvuTi/view) |
| adalar.pdf | 19 MB | [aç](https://drive.google.com/file/d/1Dek7SrnwCOJVkpEUvTSZae2Lxr_miC79/view) |
| arnavutkoy.pdf | 29 MB | [aç](https://drive.google.com/file/d/1v-DXRAvKxOc5f5Eg8h0uv2UxhsKzotIu/view) |
| atasehir.pdf | 26 MB | [aç](https://drive.google.com/file/d/1ViKAIbKnh9-Y_iuKQ7lk8tWgBZKaiWrU/view) |
| avcilar.pdf | 23 MB | [aç](https://drive.google.com/file/d/1XE18mR6tDL8FA0UPW2lFcjMqoUmEyQuW/view) |
| bagcilar.pdf | 31 MB | [aç](https://drive.google.com/file/d/1NwihzvXU1rSLZsfIqqllwjpsyuZP3Ybr/view) |
| bahcelievler.pdf | 27 MB | [aç](https://drive.google.com/file/d/1tHUWSQPNPp1CHHkgYMe7HCljrNqW-xvV/view) |
| bakirkoy.pdf | 25 MB | [aç](https://drive.google.com/file/d/1zgIEmLPERTAHnj4QILcraNW75YnBKbH5/view) |
| basaksehir.pdf | 23 MB | [aç](https://drive.google.com/file/d/1vSbGVLpJAi-sczLXx9jMQGT1vZlqcKD0/view) |
| bayrampasa.pdf | 26 MB | [aç](https://drive.google.com/file/d/16zmOO95mtqkn-jasE7UkYFYORiR8KiyI/view) |
| besiktas.pdf | 27 MB | [aç](https://drive.google.com/file/d/12t_fk_ZSbA5e9K6ZyXnPROWF138T3W3j/view) |
| beykoz.pdf | 29 MB | [aç](https://drive.google.com/file/d/1vKfKxi1maKIAqVWEPna_Y4ZMh0wDF8wc/view) |
| beylikduzu.pdf | 24 MB | [aç](https://drive.google.com/file/d/1hH4kU0RfCwWGNuukpS4v5Hrrw9tL5w7S/view) |
| beyoglu.pdf | 30 MB | [aç](https://drive.google.com/file/d/1mTP0CpBd62RYzdKdryBsmg2DERAXJiwP/view) |
| buyukcekmece.pdf | 26 MB | [aç](https://drive.google.com/file/d/1RyZy3Yuqt9OfC8sx_DzdpCd2Stx6x4Bj/view) |
| catalca.pdf | 26 MB | [aç](https://drive.google.com/file/d/1RHSyXExsEyOtopGrT8d7e-WZirx6wrnG/view) |
| cekmekoy.pdf | 24 MB | [aç](https://drive.google.com/file/d/1vcZrUtWyXHkaE-_ffhLAi6HOKIogfEvE/view) |
| esenler.pdf | 26 MB | [aç](https://drive.google.com/file/d/1vRQS8DPiEj_KVMcuIU6-gjXe3Du0pm90/view) |
| esenyurt.pdf | 30 MB | [aç](https://drive.google.com/file/d/1NmGetsKCO-7h_TREbEJgatcvj-AdPRXc/view) |
| eyup.pdf | 25 MB | [aç](https://drive.google.com/file/d/1BY7EFVAaoFHTOLM3p2OqGl1YFSOtQ1Nm/view) |
| fatih.pdf | 30 MB | [aç](https://drive.google.com/file/d/1z0UY1H3HtAH5NOAVrqlH6WdjlvI7QtpY/view) |
| gaziosmanpasa.pdf | 28 MB | [aç](https://drive.google.com/file/d/1L1MCXaz9zZ2ZNM3SgfRW-REYh4bcbrVL/view) |
| gungoren.pdf | 26 MB | [aç](https://drive.google.com/file/d/1HkKreN8rEkmle809ImOZH09eu6oWuhA4/view) |
| kadikoy.pdf | 25 MB | [aç](https://drive.google.com/file/d/1csQsO6Njl3sMia_OC3L-ON2zLSrR54wq/view) |
| kagithane.pdf | 27 MB | [aç](https://drive.google.com/file/d/19Pboh1Vgk0rr1kOHmP1zx5RWZdmsAuKu/view) |
| kartal.pdf | 25 MB | [aç](https://drive.google.com/file/d/17cVmJFlGXMobnQs0odUux9u_7aTPxwrI/view) |
| kucukcekmece.pdf | 27 MB | [aç](https://drive.google.com/file/d/1YGBJbzkxDe7WAjvGXL1_ZNRat7YSecwU/view) |
| maltepe.pdf | 24 MB | [aç](https://drive.google.com/file/d/1IX05nIxpTZwNuydbU4SH73_Yco3zXJac/view) |
| pendik.pdf | 26 MB | [aç](https://drive.google.com/file/d/1HHTqc6B4_K9YU0jjIQM5IIrTIOa1NbF5/view) |
| sancaktepe.pdf | 24 MB | [aç](https://drive.google.com/file/d/1Z5K3CyIqSDUI8hD7-LVFX29qiM8p2nkN/view) |
| sariyer.pdf | 31 MB | [aç](https://drive.google.com/file/d/1EgqUiFnGk4GdfvXaKFI59XGj4y9PiXAS/view) |
| sile.pdf | 56 MB | [aç](https://drive.google.com/file/d/1iifTYqvaLmLFJGgSinCDQ3pj1gJxYdMj/view) |
| silivri.pdf | 26 MB | [aç](https://drive.google.com/file/d/1DzSibRMBq8r4-qBBhIJjkvHUK4Y4tA0q/view) |
| sisli.pdf | 29 MB | [aç](https://drive.google.com/file/d/1qwQ_06eNltWvPhIM9vFYLO1rj5_iTLXS/view) |
| sultanbeyli.pdf | 27 MB | [aç](https://drive.google.com/file/d/1weWjOQt5nwUlAty6MnqMdf-yWdtCHaan/view) |
| sultangazi.pdf | 24 MB | [aç](https://drive.google.com/file/d/1-FNYAENE8JxleiAGDxMNKYZFFcgkdYb_/view) |
| tuzla.pdf | 24 MB | [aç](https://drive.google.com/file/d/1fRxfswlrOgpo6cEOXprst4sPXpWOrIDR/view) |
| umraniye.pdf | 29 MB | [aç](https://drive.google.com/file/d/15aRREK_FiYscYfQrZKZpCmFY-BzxH_ri/view) |
| uskudar.pdf | 31 MB | [aç](https://drive.google.com/file/d/1qYH0SsWjOJhpuv4WfiL66upPVTtpE5Pw/view) |
| zeytinburnu.pdf | 24 MB | [aç](https://drive.google.com/file/d/1eODTFWFQtykZ-9_ipRkgOo2jlBDnLpRE/view) |

</details>

**📁 [zemin-usgs](https://drive.google.com/drive/folders/10ga44SaL7Pk2DJ2ld8UDSrgIPB1V1435)** — 1 dosya, 2.7 GB

| Dosya | Boyut | Link |
|---|---:|---|
| global_vs30.tif | 2.7 GB | [aç](https://drive.google.com/file/d/11eGpTW0zYho9dzJL1VfdaeIZrZ-bzpC-/view) |

### [Tema 1 - Deprem Oncesi (Before)](https://drive.google.com/drive/folders/1g1mT494cSTwfwSYJaSZJYJAYJ5v-th_Q)

Risk, exposure, mahalle karnesi, kırılganlık.

| Dosya | Boyut | Link |
|---|---:|---|
| Afetlerde-Sosyal-Hasar-Gorebilirlik-Raporu.pdf | 6 MB | [aç](https://drive.google.com/file/d/1j2Kn4Ea9Y0yePJ7z5hmi_humPTlbIdAu/view) |
| IBB-Deprem-Senaryosu-Analiz-Sonuclari.csv | 55 KB | [aç](https://drive.google.com/file/d/1_jGaNhFFLtGaYEroZtmYBUZ-z5lySnE1/view) |
| IBB-IST-5000-Jeoloji-Raporu.pdf | 80 MB | [aç](https://drive.google.com/file/d/1NE1XClcDLPlOXzvFUTyvb1YtaBhDucEr/view) |
| IBB-Mahalle-Bazli-Bina-Sayilari-2017.csv | 44 KB | [aç](https://drive.google.com/file/d/1fk4DrdTDtyNy8UXhIvl8Z10kcRJ-S58T/view) |
| IBB-Yapi-Ruhsatina-Gore-Bina-Sayisi.xls | 28 KB | [aç](https://drive.google.com/file/d/1jBu2-tHGTh9oO9Uf-Cmz9pfTHF3NhO33/view) |
| Istanbul-Marmara-Tsunami-Risk-Raporu.pdf | 293 MB | [aç](https://drive.google.com/file/d/1xFlxmgqG2a4BEu5qdIcuaNlh7rVpRCv0/view) |
| Istanbul-Neighborhood-Multi-Hazard-Resilience-(makale).pdf | 11 MB | [aç](https://drive.google.com/file/d/16qB-RWVp8eSmIWGOeMerytZWlEzjcVxZ/view) |
| KAYNAKLAR.md | 3 KB | [aç](https://drive.google.com/file/d/1HjgE3MpigQXy-Xm0oI7fFZjz4k6RZG6w/view) |

**📁 [Mahalle-Deprem-Karnesi (islenmis)](https://drive.google.com/drive/folders/1vzUFS5r3opqXuWeFK6y8-MCUZCtUPq5A)** — 9 dosya, 535 KB

| Dosya | Boyut | Link |
|---|---:|---|
| ilce_ozet.csv | 2 KB | [aç](https://drive.google.com/file/d/1uKNpCxjPXEjJA-eFQmiWvEwn-SMlNapL/view) |
| mahalle_altyapi_hasari.csv | 26 KB | [aç](https://drive.google.com/file/d/1Zk_OvwjtJg84XnIylf6dFdhurWPIps-I/view) |
| mahalle_bina_hasari.csv | 33 KB | [aç](https://drive.google.com/file/d/1EP5Qr_qWZwrxGiJXUzm8oariG6FSyMnd/view) |
| mahalle_can_kaybi_yaralanma.csv | 31 KB | [aç](https://drive.google.com/file/d/1-tNE5gn4EGwryHbpGeFxAKbxs2F28FfJ/view) |
| mahalle_gecici_barinma.csv | 25 KB | [aç](https://drive.google.com/file/d/1W1NvJAfK_RhFHD5xLZmIZCUoxxf7xNBG/view) |
| mahalle_karne.json | 354 KB | [aç](https://drive.google.com/file/d/1iMVwEf-9kBXZQ-HgSjicITKRn_Al6-Xr/view) |
| mahalle_karne_TUMU.csv | 52 KB | [aç](https://drive.google.com/file/d/1teZM20sXhTAfOwP2QJ57uVQL7qbmlTGx/view) |
| QA_toplam_kontrol.csv | 7 KB | [aç](https://drive.google.com/file/d/1dZmcQTlAw8xjN8oGsP0cYraBKoLBLav8/view) |
| README.md | 5 KB | [aç](https://drive.google.com/file/d/1EMgp-UHcTK07A1GDLDOVmeWguFE-MS60/view) |

### [Tema 2 - Deprem Sirasi (During)](https://drive.google.com/drive/folders/1tgRRmmamvyo1kv0CdBJUwySTNsWiM14z)

Sismik feed, toplanma alanı, erken uyarı, offline.

| Dosya | Boyut | Link |
|---|---:|---|
| IERREWS-Istanbul-Erken-Uyari-Sistemi-Raporu.pdf | 7 MB | [aç](https://drive.google.com/file/d/1uihWaaFtmHeVjxfHCRWuKdUC_ZfV9Q3x/view) |
| KAYNAKLAR.md | 2 KB | [aç](https://drive.google.com/file/d/1VpwV1j2AyXYR1zcBQP3lnxzXr3yFW78y/view) |

**📁 [Sismik-Feed-Snapshotlari](https://drive.google.com/drive/folders/1ipiI4FtFq_alh97WX_GM-a0-Uv50dcyI)** — 3 dosya, 2 MB

| Dosya | Boyut | Link |
|---|---:|---|
| AFAD-Marmara-Depremler-2025-08_2026-08.csv | 143 KB | [aç](https://drive.google.com/file/d/1yM9qMw9GyWmXrbrYQQyT7P3Y8nxexBoa/view) |
| AFAD-Marmara-Depremler-2025-08_2026-08.json | 402 KB | [aç](https://drive.google.com/file/d/1aw1mNn40lJp39O4ZTpq8IYtz_420KpYS/view) |
| USGS-Turkiye-M4plus-2020_2026.geojson | 1 MB | [aç](https://drive.google.com/file/d/1sHiqVQTYqNEw28NMimMQyWylxBHUHkT4/view) |

**📁 [Toplanma-Alanlari (OSM)](https://drive.google.com/drive/folders/1jyE9Wo_hq7BkE3FyrM6jZQvg__U7P6cM)** — 1 dosya, 37 KB

| Dosya | Boyut | Link |
|---|---:|---|
| istanbul_toplanma_alanlari_OSM.geojson | 37 KB | [aç](https://drive.google.com/file/d/1ZEtFYewzAOLrZnZBg_H_6YoRejqCOnAX/view) |

### [Tema 3 - Deprem Sonrasi (After)](https://drive.google.com/drive/folders/1HkPmXjcoUmcgyVdQhq-DpuatU1g-F_qD)

PDNA, barınma, hasar, sağlık tesisleri, saha raporları.

| Dosya | Boyut | Link |
|---|---:|---|
| Digital-Post-Disaster-Risk-Twinning-(makale).pdf | 7 MB | [aç](https://drive.google.com/file/d/1ghZNsdXhw2qOGnW5zGw2HBp8aD7-ee-5/view) |
| EEFIT-Kocaeli-Saha-Raporu.pdf | 28 MB | [aç](https://drive.google.com/file/d/1UFicduUp7n2MCoLvwGLD071U2e1wqQC4/view) |
| EEFIT-Marmara-Saha-Raporu-2025.pdf | 7 MB | [aç](https://drive.google.com/file/d/1Wb8h1TFIV3OWgslkNFfi3swg6raf4byf/view) |
| IBB-Enkaz-Yonetim-Plani-Raporu.pdf | 4 MB | [aç](https://drive.google.com/file/d/1RmBLJ2XNbUq7kUhQCyt9fWJxncuhZsVv/view) |
| KAYNAKLAR.md | 2 KB | [aç](https://drive.google.com/file/d/1xKEpwGvoygZYboGUwbmv62_c6q-pTgJd/view) |
| PDNA-PostDisasterNeedAssessment-Volume-A.pdf | 2 MB | [aç](https://drive.google.com/file/d/1PMhvMLIRR2tHECeW7x1DZtfMGEOj3FMV/view) |
| PDNA-Volume-B-Saglik-Sektoru-WHO.pdf | 1009 KB | [aç](https://drive.google.com/file/d/1ShV8HcjdSudYdIv2QPdWzjUHSBjte-4i/view) |
| Sphere-Handbook-2018-Insani-Standartlar-EN.pdf | 6 MB | [aç](https://drive.google.com/file/d/1Vu9-ELTi_d7--t8sF3ebGt6bHBNhT8wI/view) |

**📁 [Saglik-Tesisleri (OSM)](https://drive.google.com/drive/folders/145KNqjhzf9Bjzz1ialjX0YgUquODmg50)** — 2 dosya, 1 MB

| Dosya | Boyut | Link |
|---|---:|---|
| istanbul_eczaneler_OSM.geojson | 1 MB | [aç](https://drive.google.com/file/d/1g9WMgVDFoDNx2jb2WB7O6djs-uJXROIO/view) |
| istanbul_hastaneler_OSM.geojson | 141 KB | [aç](https://drive.google.com/file/d/1TnSdA8zPCML86ryZqFwNE0_qxcPF78z1/view) |

### [02 Kaynaklar](https://drive.google.com/drive/folders/162PNXCBAO5gxatpjDFZ328O4eYwRsVoO)

Ham/orijinal dosya adlarıyla arşiv. **Büyük ölçüde yukarıdaki klasörlerin kopyasıdır** — normalde tema klasörlerini kullanın.

| Dosya | Boyut | Link |
|---|---:|---|
| 2017-yl-mahalle-bazl-bina-saylar.csv | 44 KB | [aç](https://drive.google.com/file/d/1jviPojNHqoKikkc_5867dptoGgvILSqz/view) |
| afetler-karsisinda-sosyal-hasar-gorebilirlik-sonuc-raporu-66866b95c4679.pdf | 6 MB | [aç](https://drive.google.com/file/d/1gFXSzIsMGAoIlUEbfSeidvCTUlqzayxx/view) |
| Deprem Impact Lab — İstanbul açık veri kaynakları.xlsx | 13 KB | [aç](https://drive.google.com/file/d/1DMZit8roHPVj0l3SPqW9UgZD-3itJxvD/view) |
| deprem-senaryosu-analiz-sonuclar.csv | 55 KB | [aç](https://drive.google.com/file/d/1O58sR-qnfjT6klOCDuHAH-HIuDkmscEL/view) |
| DEZiM_KANDiLLi_DEPREM-HASAR-TAHMiN_RAPORU.pdf | 39 MB | [aç](https://drive.google.com/file/d/1duUiT8Xf1n3jbqW68LbqT0V46kseNJoX/view) |
| Digital post-disaster risk management twinning- A review and improved conceptual framework.pdf | 7 MB | [aç](https://drive.google.com/file/d/1FU-g4cSlbewux9ly8cEogN0lFS3rS9YX/view) |
| Earthquake-based multi-hazard resilience assessment a case study of Istanbul, Turkey (neighborhood level).pdf | 11 MB | [aç](https://drive.google.com/file/d/1MKyiUF1Yw0Qa3zlbLxvMpxq9edz767YY/view) |
| EEFIT-Marmara-April-2025.pdf | 7 MB | [aç](https://drive.google.com/file/d/1fW-EGU87f8cA3L-1uG2C_J7UwALXigpG/view) |
| enkaz-yonetim-plani-rapor-666ad9a07d134.pdf | 4 MB | [aç](https://drive.google.com/file/d/1bcZvQk7E6YZqeuF-QiWWpmpc5bYj51DE/view) |
| ierrews-rapor-66a6a12ee02d7.pdf | 7 MB | [aç](https://drive.google.com/file/d/1muiZ97crx1EwVIlj9aONjjKyfprHaaSl/view) |
| ist-5000-jeoloji-rapor-66a3a3f29ed03.pdf | 80 MB | [aç](https://drive.google.com/file/d/1LfOY9pLrMwU_z64Q2ag2NYflTeNCbhx6/view) |
| istanbul-ili-marmara-kiyilarinda-tsunami-kaynakli-risk-arastirmasi-sonuc-raporu-66866e4d3981a.pdf | 293 MB | [aç](https://drive.google.com/file/d/1fBM-PtBEbMvqmVg3pbg0ZRS89dSHplov/view) |
| istanbul-olasi-deprem-kayiplari-tahminlerinin-guncellenmesil-sonuc-rapor-2010-677cd0b478dc9.pdf | 19 MB | [aç](https://drive.google.com/file/d/1RE5H_9apswpMCdEqga9_1qa26uFEu3KL/view) |
| istanbuldaki-yap-ruhsatna-gore-bina-says.xls | 28 KB | [aç](https://drive.google.com/file/d/1-80fBMcYvfqd9IBmAxin4m_oesWzj-F5/view) |
| report-eefit-kocaeli-turkey-20190814.PDF | 28 MB | [aç](https://drive.google.com/file/d/1PdNM1Vi_OA-YFDY0QXJ6rFTGkJi3dLHo/view) |

**📁 [ilce_kitapciklari](https://drive.google.com/drive/folders/1JqD-3n20N87HB9AF-pPSMFFb0v_Dr8sk)** — 40 dosya, 1.0 GB

<details><summary>40 dosyayı listele</summary>

| Dosya | Boyut | Link |
|---|---:|---|
| _urls.txt | 3 KB | [aç](https://drive.google.com/file/d/1HY1KpM8zhFVB2zlLUskgCRwGbddioOnx/view) |
| adalar.pdf | 19 MB | [aç](https://drive.google.com/file/d/1HnO38BcYgy6aI8hFAPDuGOoG-DU_asKz/view) |
| arnavutkoy.pdf | 29 MB | [aç](https://drive.google.com/file/d/1SfWoZtd_sX9IZXj8gznXhZgcF-8-CDWB/view) |
| atasehir.pdf | 26 MB | [aç](https://drive.google.com/file/d/1zSqHCHfkGlP0qHOqjMRt_3jQln321L29/view) |
| avcilar.pdf | 23 MB | [aç](https://drive.google.com/file/d/1bi72Si6NKnBChONGjKAOaVcSLGlmabeV/view) |
| bagcilar.pdf | 31 MB | [aç](https://drive.google.com/file/d/1KT-Oj-424gvQgVFR_3qoQLqaaoh8ftTo/view) |
| bahcelievler.pdf | 27 MB | [aç](https://drive.google.com/file/d/1qRNP5SXfStiY9TwWTU2Mu2PfPA1CG3sH/view) |
| bakirkoy.pdf | 25 MB | [aç](https://drive.google.com/file/d/1R2ipva9bvHvfbRw-U3t0o7xfQCIia5Oj/view) |
| basaksehir.pdf | 23 MB | [aç](https://drive.google.com/file/d/1uev86WGOb2-RxO50q5EdLRUDs0eXwdMJ/view) |
| bayrampasa.pdf | 26 MB | [aç](https://drive.google.com/file/d/11hH2p8SzG_NOhX1HhwPoRz97McrGxJYg/view) |
| besiktas.pdf | 27 MB | [aç](https://drive.google.com/file/d/1bUXDNNOx2Dw77DrbiFH_cu5OjdRc-Wf8/view) |
| beykoz.pdf | 29 MB | [aç](https://drive.google.com/file/d/1DXpdn3UeAOTgXKK4gmxpMwYlTW0-G5_c/view) |
| beylikduzu.pdf | 24 MB | [aç](https://drive.google.com/file/d/1-vbxU8SZDkjkljr86HLrc13evLHiarr_/view) |
| beyoglu.pdf | 30 MB | [aç](https://drive.google.com/file/d/1TKuz1lAeplDH2-KB6Bo9pHZSAkj719sp/view) |
| buyukcekmece.pdf | 26 MB | [aç](https://drive.google.com/file/d/1EvuxSBpvvc-xSLCJ4zOcy8wFI-vCcRS7/view) |
| catalca.pdf | 26 MB | [aç](https://drive.google.com/file/d/1kLslp4cgjwO5ZynTCuQnBqxNgwKY0jHJ/view) |
| cekmekoy.pdf | 24 MB | [aç](https://drive.google.com/file/d/1oFjYHsSdo21U8SZ3pEYnfOuF_1A2NySM/view) |
| esenler.pdf | 26 MB | [aç](https://drive.google.com/file/d/1xorFpUKlP3OTz9zZ6cl9BLJisk3rjk_v/view) |
| esenyurt.pdf | 30 MB | [aç](https://drive.google.com/file/d/1gPw0sn5fwudyT6lX9OBSGMMM2UflvCMz/view) |
| eyup.pdf | 25 MB | [aç](https://drive.google.com/file/d/1-sk9iwBWIaUZOpioxkYRdbXFH0mSIyC5/view) |
| fatih.pdf | 30 MB | [aç](https://drive.google.com/file/d/15kLOmnynDJdv6gxhm8cn9VzVJGi9mkdM/view) |
| gaziosmanpasa.pdf | 28 MB | [aç](https://drive.google.com/file/d/1H38lvpf5opjHdHH231acjvS99UMeTuEd/view) |
| gungoren.pdf | 26 MB | [aç](https://drive.google.com/file/d/1GyhP5LFnH6uyO1jc4ZqdI8dnlDGuVHok/view) |
| kadikoy.pdf | 25 MB | [aç](https://drive.google.com/file/d/1mzkam4ziNmxpEEc5KGymcygqyn1biAwo/view) |
| kagithane.pdf | 27 MB | [aç](https://drive.google.com/file/d/1lVHLOxS7P_HDTSY2Sa62fn0m0chiWjCx/view) |
| kartal.pdf | 25 MB | [aç](https://drive.google.com/file/d/1QFAjc7VeX8f4D_WaNH0ZMiTC2ZKpu3GP/view) |
| kucukcekmece.pdf | 27 MB | [aç](https://drive.google.com/file/d/15UvM2poYeGVUB32IM1afoP_UZ66gCxPb/view) |
| maltepe.pdf | 24 MB | [aç](https://drive.google.com/file/d/1ctvjBEITaTPdIshAhGHBE7YO3HTQ7twI/view) |
| pendik.pdf | 26 MB | [aç](https://drive.google.com/file/d/1yNgKDiw0vnjmukckYE9YdcmRV0Nrb5Xc/view) |
| sancaktepe.pdf | 24 MB | [aç](https://drive.google.com/file/d/1BngO964IBWmXXzXcXmytxJ1ThI_UUohR/view) |
| sariyer.pdf | 31 MB | [aç](https://drive.google.com/file/d/14RdyligYNhziZkgLTNORN71TR4D93V-z/view) |
| sile.pdf | 56 MB | [aç](https://drive.google.com/file/d/1wdoMLil2LXmkOwTrzXmbdTx6v4xgbFUv/view) |
| silivri.pdf | 26 MB | [aç](https://drive.google.com/file/d/1mGyeLjHNjv3VGdjfwvmfxKP4EKT98_El/view) |
| sisli.pdf | 29 MB | [aç](https://drive.google.com/file/d/1_JoE1txkDuazxljLWiWXmEHzLjrEq_lc/view) |
| sultanbeyli.pdf | 27 MB | [aç](https://drive.google.com/file/d/1v56395jl_V8GrdauKMDr3XNIfQoFKm-r/view) |
| sultangazi.pdf | 24 MB | [aç](https://drive.google.com/file/d/1I-2CkljikQUhHY7rZnc5IT1EEZfm-7uo/view) |
| tuzla.pdf | 24 MB | [aç](https://drive.google.com/file/d/16zkYf1rBFTVSbapjX97VOUBTyxu6834D/view) |
| umraniye.pdf | 29 MB | [aç](https://drive.google.com/file/d/1w4CD1ekw8-55Ly2Iy0r6jLMhTxejdC3P/view) |
| uskudar.pdf | 31 MB | [aç](https://drive.google.com/file/d/1DBfZqVarQK8s-owc-SkgRtIh3CmcGd6N/view) |
| zeytinburnu.pdf | 24 MB | [aç](https://drive.google.com/file/d/1qIUT3HcQpNEEII_GTsp1ucwilaWROtoX/view) |

</details>

---

## 3 kural (jüri de buna bakar)

1. **Senaryo çıktısıdır, kesin tahmin değil.** Kaynak + tarih + varsayımı arayüzde göster ("2019 senaryo, Mw 7.5 gece").
2. **Tekil bina hükmü yok.** Hiçbir ürün bir binaya "riskli/güvenli" diyemez (RYTEİE §A.1.1). Yapılabilen: bölgesel önceliklendirme + süreç yönlendirme.
3. **KVKK.** Demoda sentetik/agrege veri; gerçek kişisel veri toplayan canlı sistem yok.

## Not

- Büyük dosyalar (tsunami raporu ~292 MB, IST-5000 jeoloji ~79 MB, `global_vs30.tif` ~2.8 GB) referans/okuma içindir; **repoya commit'lemeyin** — GitHub 100 MB üzeri dosyayı reddeder.
- Ham 39 ilçe kitapçığı PDF'i ayrıca `ilce_kitapciklari/` klasöründedir (işlenmiş CSV'ler Tema 1'dedir).
- Kaynakların çoğu İBB Açık Veri, AFAD, KOERI, TÜİK ve uluslararası kurumlardandır; lisanslara `KAYNAKLAR.md`'lerden bakın.
- Linkler Drive klasörünün paylaşım iznini miras alır; açılmıyorsa klasöre erişimin olduğundan emin ol.
