// Kenya administrative units — counties, constituencies, wards.
// Source: IEBC-gazetted 47 counties, 290 constituencies, 1,448 wards
// (dataset: its-kios09/osm-kenya-boundaries, MIT).

export interface County {
  name: string;
  constituencies: string[];
}

interface ConstituencyRecord {
  name: string;
  county: string;
  wards: string[];
}

const RAW: { name: string; constituencies: { name: string; wards: string[] }[] }[] = 
[
  {
    "name": "Baringo",
    "constituencies": [
      {
        "name": "Baringo Central",
        "wards": [
          "Ewalel Chapchap",
          "Kabarnet",
          "Kapropita",
          "Sacho",
          "Tenges"
        ]
      },
      {
        "name": "Baringo North",
        "wards": [
          "Bartabwa",
          "Barwessa",
          "Kabartonjo",
          "Saimo/Kipsaraman",
          "Saimo/Soi"
        ]
      },
      {
        "name": "Baringo South",
        "wards": [
          "Ilchamus",
          "Marigat",
          "Mochongoi",
          "Mukutani"
        ]
      },
      {
        "name": "Eldama Ravine",
        "wards": [
          "Koibatek",
          "Lembus",
          "Lembus Kwen",
          "Lembus/Perkerra",
          "Mumberes/Maji Mazuri",
          "Ravine"
        ]
      },
      {
        "name": "Mogotio",
        "wards": [
          "Emining",
          "Kisanana",
          "Mogotio"
        ]
      },
      {
        "name": "Tiaty",
        "wards": [
          "Churo/Amaya",
          "Kolowa",
          "Loiyamorock",
          "Ribkwo",
          "Silale",
          "Tangulbei/Korossi",
          "Tirioko"
        ]
      }
    ]
  },
  {
    "name": "Bomet",
    "constituencies": [
      {
        "name": "Bomet Central",
        "wards": [
          "Chesoen",
          "Mutarakwa",
          "Ndaraweta",
          "Silibwet Township",
          "Singorwet"
        ]
      },
      {
        "name": "Bomet East",
        "wards": [
          "Chemaner",
          "Kembu",
          "Kipreres",
          "Longisa",
          "Merigi"
        ]
      },
      {
        "name": "Chepalungu",
        "wards": [
          "Chebunyo",
          "Kong'asis",
          "Nyangores",
          "Sigor",
          "Siongiroi"
        ]
      },
      {
        "name": "Konoin",
        "wards": [
          "Boito",
          "Chepchabas",
          "Embomos",
          "Kimulot",
          "Mogogosiek"
        ]
      },
      {
        "name": "Sotik",
        "wards": [
          "Chemagel",
          "Kapletundo",
          "Kipsonoi",
          "Ndanai/Abosi",
          "Rongena/Manaret"
        ]
      }
    ]
  },
  {
    "name": "Bungoma",
    "constituencies": [
      {
        "name": "Bumula",
        "wards": [
          "Bumula",
          "Kabula",
          "Khasoko",
          "Kimaeti",
          "Siboti",
          "South Bukusu",
          "West Bukusu"
        ]
      },
      {
        "name": "Kabuchai",
        "wards": [
          "Bwake/Luuya",
          "Kabuchai/Chwele",
          "Mukuyuni",
          "West Nalondo"
        ]
      },
      {
        "name": "Kanduyi",
        "wards": [
          "Bukembe East",
          "Bukembe West",
          "East Sang'alo",
          "Khalaba",
          "Marakaru/Tuuti",
          "Musikoma",
          "Sang'alo West",
          "Township"
        ]
      },
      {
        "name": "Kimilili",
        "wards": [
          "Kamukuywa",
          "Kibingei",
          "Kimilili",
          "Maeni"
        ]
      },
      {
        "name": "Mt. Elgon",
        "wards": [
          "Cheptais",
          "Chepyuk",
          "Chesikaki",
          "Elgon",
          "Kapkateny",
          "Kaptama"
        ]
      },
      {
        "name": "Sirisia",
        "wards": [
          "Lwandanyi",
          "Malakisi/South Kulisiru",
          "Namwela"
        ]
      },
      {
        "name": "Tongaren",
        "wards": [
          "Mbakalo",
          "Milima",
          "Naitiri/Kabuyefwe",
          "Ndalu/Tabani",
          "Soysambu/Mitua",
          "Tongaren"
        ]
      },
      {
        "name": "Webuye East",
        "wards": [
          "Maraka",
          "Mihuu",
          "Ndivisi"
        ]
      },
      {
        "name": "Webuye West",
        "wards": [
          "Bokoli",
          "Matulo",
          "Misikhu",
          "Sitikho"
        ]
      }
    ]
  },
  {
    "name": "Busia",
    "constituencies": [
      {
        "name": "Budalangi",
        "wards": [
          "Bunyala Central",
          "Bunyala North",
          "Bunyala South",
          "Bunyala West"
        ]
      },
      {
        "name": "Butula",
        "wards": [
          "Elugulu",
          "Kingandole",
          "Marachi Central",
          "Marachi East",
          "Marachi North",
          "Marachi West"
        ]
      },
      {
        "name": "Funyula",
        "wards": [
          "Ageng'a Nanguba",
          "Bwiri",
          "Namboboto Nambuku",
          "Nangina"
        ]
      },
      {
        "name": "Matayos",
        "wards": [
          "Bukhayo West",
          "Burumba",
          "Busibwabo",
          "Matayos South",
          "Mayenje"
        ]
      },
      {
        "name": "Nambale",
        "wards": [
          "Bukhayo Central",
          "Bukhayo East",
          "Bukhayo North/Waltsi",
          "Nambale Township"
        ]
      },
      {
        "name": "Teso North",
        "wards": [
          "Ang'urai East",
          "Ang'urai North",
          "Ang'urai South",
          "Malaba Central",
          "Malaba North",
          "Malaba South"
        ]
      },
      {
        "name": "Teso South",
        "wards": [
          "Amukura Central",
          "Amukura East",
          "Amukura West",
          "Ang'orom",
          "Chakol North",
          "Chakol South"
        ]
      }
    ]
  },
  {
    "name": "Embu",
    "constituencies": [
      {
        "name": "Manyatta",
        "wards": [
          "Gaturi South",
          "Kirimari",
          "Kithimu",
          "Mbeti North",
          "Nginda",
          "Ruguru/Ngandori"
        ]
      },
      {
        "name": "Mbeere North",
        "wards": [
          "Evurore",
          "Muminji",
          "Nthawa"
        ]
      },
      {
        "name": "Mbeere South",
        "wards": [
          "Kiambere",
          "Makima",
          "Mavuria",
          "Mbeti South",
          "Mwea"
        ]
      },
      {
        "name": "Runyenjes",
        "wards": [
          "Central  Ward",
          "Gaturi North",
          "Kagaari North",
          "Kagaari South",
          "Kyeni North",
          "Kyeni South"
        ]
      }
    ]
  },
  {
    "name": "Elgeyo-Marakwet",
    "constituencies": [
      {
        "name": "Keiyo North",
        "wards": [
          "Emsoo",
          "Kamariny",
          "Kapchemutwa",
          "Tambach"
        ]
      },
      {
        "name": "Keiyo South",
        "wards": [
          "Chepkorio",
          "Kabiemit",
          "Kaptarakwa",
          "Metkei",
          "Soy North",
          "Soy South"
        ]
      },
      {
        "name": "Marakwet East",
        "wards": [
          "Embobut/Embulot",
          "Endo",
          "Kapyego",
          "Sambirir"
        ]
      },
      {
        "name": "Marakwet West",
        "wards": [
          "Arror",
          "Kapsowar",
          "Lelan",
          "Moiben/Kuserwo",
          "Sengwer"
        ]
      }
    ]
  },
  {
    "name": "Garissa",
    "constituencies": [
      {
        "name": "Balambala",
        "wards": [
          "Balambala",
          "Danyere",
          "Jara Jara",
          "Saka",
          "Sankuri"
        ]
      },
      {
        "name": "Dadaab",
        "wards": [
          "Abakaile",
          "Dadaab",
          "Damajale",
          "Dertu",
          "Labasigale",
          "Liboi"
        ]
      },
      {
        "name": "Fafi",
        "wards": [
          "Bura",
          "Dekaharia",
          "Fafi",
          "Jarajila",
          "Nanighi"
        ]
      },
      {
        "name": "Garissa Township",
        "wards": [
          "Galbet",
          "Iftin",
          "Township",
          "Waberi"
        ]
      },
      {
        "name": "Ijara",
        "wards": [
          "Hulugho",
          "Ijara",
          "Masalani",
          "Sangailu"
        ]
      },
      {
        "name": "Lagdera",
        "wards": [
          "Baraki",
          "Benane",
          "Goreale",
          "Maalimin",
          "Modogashe",
          "Sabena"
        ]
      }
    ]
  },
  {
    "name": "Homa Bay",
    "constituencies": [
      {
        "name": "Homa Bay Town",
        "wards": [
          "Homa Bay Arujo",
          "Homa Bay Central",
          "Homa Bay East",
          "Homa Bay West"
        ]
      },
      {
        "name": "Kabondo Kasipul",
        "wards": [
          "Kabondo East",
          "Kabondo West",
          "Kojwach",
          "Kokwanyo/Kakelo"
        ]
      },
      {
        "name": "Karachuonyo",
        "wards": [
          "Central",
          "Kanyaluo",
          "Kendu Bay Town",
          "Kibiri",
          "North Karachuonyo",
          "Wangchieng",
          "West Karachuonyo"
        ]
      },
      {
        "name": "Kasipul",
        "wards": [
          "Central Kasipul",
          "East Kamagak",
          "South Kasipul",
          "West Kamagak",
          "West Kasipul"
        ]
      },
      {
        "name": "Mbita",
        "wards": [
          "Gembe",
          "Kasgunga",
          "Lambwe",
          "Mfangano Island",
          "Rusinga Island"
        ]
      },
      {
        "name": "Ndhiwa",
        "wards": [
          "Kabuoch South/Pala",
          "Kanyadoto",
          "Kanyamwa Kologi",
          "Kanyamwa Kosewe",
          "Kanyikela",
          "Kwabwai",
          "North Kabuoch"
        ]
      },
      {
        "name": "Rangwe",
        "wards": [
          "East Gem",
          "Kagan",
          "Kochia",
          "West Gem"
        ]
      },
      {
        "name": "Suba",
        "wards": [
          "Gwassi North",
          "Gwassi South",
          "Kaksingri West",
          "Ruma Kaksingri East"
        ]
      }
    ]
  },
  {
    "name": "Isiolo",
    "constituencies": [
      {
        "name": "Isiolo North",
        "wards": [
          "Bulla Pesa",
          "Burat",
          "Chari",
          "Cherab",
          "Ngare Mara",
          "Oldonyiro",
          "Wabera"
        ]
      },
      {
        "name": "Isiolo South",
        "wards": [
          "Garbatulla",
          "Kinna",
          "Sericho"
        ]
      }
    ]
  },
  {
    "name": "Kajiado",
    "constituencies": [
      {
        "name": "Kajiado Central",
        "wards": [
          "Dalalekutuk",
          "Ildamat",
          "Matapato North",
          "Matapato South",
          "Purko"
        ]
      },
      {
        "name": "Kajiado East",
        "wards": [
          "Imaroro",
          "Kaputiei North",
          "Kenyawa-Poka",
          "Kitengela",
          "Oloosirkon/Sholinke"
        ]
      },
      {
        "name": "Kajiado North",
        "wards": [
          "Ngong",
          "Nkaimurunya",
          "Olkeri",
          "Oloolua",
          "Ongata Rongai"
        ]
      },
      {
        "name": "Kajiado South",
        "wards": [
          "Entonet/Lenkisim",
          "Kimana",
          "Kuku",
          "Mbirikani/Eselenkei",
          "Rombo"
        ]
      },
      {
        "name": "Kajiado West",
        "wards": [
          "Ewuaso Oonkidong'i",
          "Iloodokilani",
          "Keekonyokie",
          "Magadi",
          "Mosiro"
        ]
      }
    ]
  },
  {
    "name": "Kakamega",
    "constituencies": [
      {
        "name": "Butere",
        "wards": [
          "Marama Central",
          "Marama North",
          "Marama South",
          "Marama West",
          "Marenyo - Shianda"
        ]
      },
      {
        "name": "Ikolomani",
        "wards": [
          "Idakho Central",
          "Idakho East",
          "Idakho North",
          "Idakho South"
        ]
      },
      {
        "name": "Khwisero",
        "wards": [
          "Kisa Central",
          "Kisa East",
          "Kisa North",
          "Kisa West"
        ]
      },
      {
        "name": "Likuyani",
        "wards": [
          "Kongoni",
          "Likuyani",
          "Nzoia",
          "Sango",
          "Sinoko"
        ]
      },
      {
        "name": "Lugari",
        "wards": [
          "Chekalini",
          "Chevaywa",
          "Lugari",
          "Lumakanda",
          "Lwandeti",
          "Mautuma"
        ]
      },
      {
        "name": "Lurambi",
        "wards": [
          "Butsotso Central",
          "Butsotso East",
          "Butsotso South",
          "Mahiakalo",
          "Sheywe",
          "Shirere"
        ]
      },
      {
        "name": "Malava",
        "wards": [
          "Butali/Chegulo",
          "Chemuche",
          "East Kabras",
          "Manda-Shivanga",
          "Shirugu-Mugai",
          "South Kabras",
          "West Kabras"
        ]
      },
      {
        "name": "Matungu",
        "wards": [
          "Khalaba",
          "Kholera",
          "Koyonzo",
          "Mayoni",
          "Namamali"
        ]
      },
      {
        "name": "Mumias East",
        "wards": [
          "East Wanga",
          "Isongo/Makunga/Malaha",
          "Lubinu/Lusheya"
        ]
      },
      {
        "name": "Mumias West",
        "wards": [
          "Etenje",
          "Mumias Central",
          "Mumias North",
          "Musanda"
        ]
      },
      {
        "name": "Navakholo",
        "wards": [
          "Bunyala Central",
          "Bunyala East",
          "Bunyala West",
          "Ingostse-Mathia",
          "Shinoyi-Shikomari-"
        ]
      },
      {
        "name": "Shinyalu",
        "wards": [
          "Isukha Central",
          "Isukha East",
          "Isukha North",
          "Isukha South",
          "Isukha West",
          "Murhanda"
        ]
      }
    ]
  },
  {
    "name": "Kericho",
    "constituencies": [
      {
        "name": "Ainamoi",
        "wards": [
          "Ainamoi",
          "Kapkugerwet",
          "Kapsaos",
          "Kapsoit",
          "Kipchebor",
          "Kipchimchim"
        ]
      },
      {
        "name": "Belgut",
        "wards": [
          "Chaik",
          "Cheptororiet/Seretut",
          "Kabianga",
          "Kapsuser",
          "Waldai"
        ]
      },
      {
        "name": "Bureti",
        "wards": [
          "Cheboin",
          "Chemosot",
          "Cheplanget",
          "Kapkatet",
          "Kisiara",
          "Litein",
          "Tebesonik"
        ]
      },
      {
        "name": "Kipkelion East",
        "wards": [
          "Chepseon",
          "Kedowa/Kimugul",
          "Londiani",
          "Tendeno/Sorget"
        ]
      },
      {
        "name": "Kipkelion West",
        "wards": [
          "Chilchila",
          "Kamasian",
          "Kipkelion",
          "Kunyak"
        ]
      },
      {
        "name": "Sigowet/Soin",
        "wards": [
          "Kaplelartet",
          "Sigowet",
          "Soin",
          "Soliat"
        ]
      }
    ]
  },
  {
    "name": "Kiambu",
    "constituencies": [
      {
        "name": "Gatundu North",
        "wards": [
          "Chania",
          "Githobokoni",
          "Gituamba",
          "Mang'u"
        ]
      },
      {
        "name": "Gatundu South",
        "wards": [
          "Kiamwangi",
          "Kiganjo",
          "Ndarugu",
          "Ngenda"
        ]
      },
      {
        "name": "Githunguri",
        "wards": [
          "Githiga",
          "Githunguri",
          "Ikinu",
          "Komothai",
          "Ngewa"
        ]
      },
      {
        "name": "Juja",
        "wards": [
          "Juja",
          "Kalimoni",
          "Murera",
          "Theta",
          "Witeithie"
        ]
      },
      {
        "name": "Kabete",
        "wards": [
          "Gitaru",
          "Kabete",
          "Muguga",
          "Nyadhuna",
          "Uthiru"
        ]
      },
      {
        "name": "Kiambaa",
        "wards": [
          "Cianda",
          "Karuri",
          "Kihara",
          "Muchatha",
          "Ndenderu"
        ]
      },
      {
        "name": "Kiambu",
        "wards": [
          "Ndumberi",
          "Riabai",
          "Ting'ang'a",
          "Township"
        ]
      },
      {
        "name": "Kikuyu",
        "wards": [
          "Karai",
          "Kikuyu",
          "Kinoo",
          "Nachu",
          "Sigona"
        ]
      },
      {
        "name": "Lari",
        "wards": [
          "Kamburu",
          "Kijabe",
          "Kinale",
          "Lari/Kirenga",
          "Nyanduma"
        ]
      },
      {
        "name": "Limuru",
        "wards": [
          "Bibirioni",
          "Limuru Central",
          "Limuru East",
          "Ndeiya",
          "Ngecha Tigoni"
        ]
      },
      {
        "name": "Ruiru",
        "wards": [
          "Biashara",
          "Gatongora",
          "Gitothua",
          "Kahawa Sukari",
          "Kahawa Wendani",
          "Kiuu",
          "Mwihoko",
          "Mwiki"
        ]
      },
      {
        "name": "Thika Town",
        "wards": [
          "Gatuanyaga",
          "Hospital",
          "Kamenu",
          "Ngoliba",
          "Township"
        ]
      }
    ]
  },
  {
    "name": "Kilifi",
    "constituencies": [
      {
        "name": "Ganze",
        "wards": [
          "Bamba",
          "Ganze",
          "Jaribuni",
          "Sokoke"
        ]
      },
      {
        "name": "Kaloleni",
        "wards": [
          "Kaloleni",
          "Kayafungo",
          "Mariakani",
          "Mwanamwinga"
        ]
      },
      {
        "name": "Kilifi North",
        "wards": [
          "Dabaso",
          "Kibarani",
          "Matsangoni",
          "Mnarani",
          "Sokoni",
          "Tezo",
          "Watamu"
        ]
      },
      {
        "name": "Kilifi South",
        "wards": [
          "Chasimba",
          "Junju",
          "Mtepeni",
          "Mwarakaya",
          "Shimo La Tewa"
        ]
      },
      {
        "name": "Magarini",
        "wards": [
          "Adu",
          "Garashi",
          "Gongoni",
          "Magarini",
          "Marafa",
          "Sabaki"
        ]
      },
      {
        "name": "Malindi",
        "wards": [
          "Ganda",
          "Jilore",
          "Kakuyuni",
          "Malindi Town",
          "Shella"
        ]
      },
      {
        "name": "Rabai",
        "wards": [
          "Kambe/Ribe",
          "Mwawesa",
          "Rabai/Kisurutini",
          "Ruruma"
        ]
      }
    ]
  },
  {
    "name": "Kirinyaga",
    "constituencies": [
      {
        "name": "Gichugu",
        "wards": [
          "Baragwi",
          "Kabare",
          "Karumandi",
          "Ngariama",
          "Njukiini"
        ]
      },
      {
        "name": "Kirinyaga Central",
        "wards": [
          "Inoi",
          "Kanyeki-Ini",
          "Kerugoya",
          "Mutira"
        ]
      },
      {
        "name": "Mwea",
        "wards": [
          "Gathigiriri",
          "Kangai",
          "Murinduko",
          "Mutithi",
          "Nyangati",
          "Tebere",
          "Thiba",
          "Wamumu"
        ]
      },
      {
        "name": "Ndia",
        "wards": [
          "Kariti",
          "Kiine",
          "Mukure"
        ]
      }
    ]
  },
  {
    "name": "Kisii",
    "constituencies": [
      {
        "name": "Bobasi",
        "wards": [
          "Bobasi Bogetaorio",
          "Bobasi Boitangare",
          "Bobasi Central",
          "Bobasi Chache",
          "Masige East",
          "Masige West",
          "Nyacheki",
          "Sameta/Mokwerero"
        ]
      },
      {
        "name": "Bomachoge Borabu",
        "wards": [
          "Bokimonge",
          "Bombaba Borabu",
          "Boochi Borabu",
          "Magenche"
        ]
      },
      {
        "name": "Bomachoge Chache",
        "wards": [
          "Boochi/Tendere",
          "Bosoti/Sengera",
          "Majoge"
        ]
      },
      {
        "name": "Bonchari",
        "wards": [
          "Bogiakumu",
          "Bomariba",
          "Bomorenda",
          "Riana"
        ]
      },
      {
        "name": "Kitutu Chache North",
        "wards": [
          "Kegogi",
          "Marani",
          "Monyerero",
          "Sensi"
        ]
      },
      {
        "name": "Kitutu Chache South",
        "wards": [
          "Bogeka",
          "Bogusero",
          "Nyakoe",
          "Nyatieko"
        ]
      },
      {
        "name": "Nyaribari Chache",
        "wards": [
          "Birongo",
          "Bobaracho",
          "Ibeno",
          "Keumbu",
          "Kiogoro",
          "Kisii Central"
        ]
      },
      {
        "name": "Nyaribari Masaba",
        "wards": [
          "Gesusu",
          "Ichuni",
          "Kiamokama",
          "Masimba",
          "Nyamasibi"
        ]
      },
      {
        "name": "South Mugirango",
        "wards": [
          "Bogetenga",
          "Boikang'a",
          "Borabu/Chitago",
          "Getenga",
          "Moticho",
          "Tabaka"
        ]
      }
    ]
  },
  {
    "name": "Kisumu",
    "constituencies": [
      {
        "name": "Kisumu Central",
        "wards": [
          "Kondele",
          "Market Milimani",
          "Migosi",
          "Nyalenda B",
          "Railways",
          "Shaurimoyo Kaloleni"
        ]
      },
      {
        "name": "Kisumu East",
        "wards": [
          "Kajulu",
          "Kolwa Central",
          "Kolwa East",
          "Manyatta 'b'",
          "Nyalenda 'a'"
        ]
      },
      {
        "name": "Kisumu West",
        "wards": [
          "Central Kisumu",
          "Kisumu North",
          "North West Kisumu",
          "South West Kisumu",
          "West Kisumu"
        ]
      },
      {
        "name": "Muhoroni",
        "wards": [
          "Chemelil",
          "Masogo/Nyang'oma",
          "Miwani",
          "Muhoroni/Koru",
          "Ombeyi"
        ]
      },
      {
        "name": "Nyakach",
        "wards": [
          "Central Nyakach",
          "North Nyakach",
          "South East Nyakach",
          "South West Nyakach",
          "West Nyakach"
        ]
      },
      {
        "name": "Nyando",
        "wards": [
          "Ahero",
          "Awasi/Onjiko",
          "East Kano/Wawidhi",
          "Kabonyo/Kanyagwal",
          "Kobura"
        ]
      },
      {
        "name": "Seme",
        "wards": [
          "Central Seme",
          "East Seme",
          "North Seme",
          "West Seme"
        ]
      }
    ]
  },
  {
    "name": "Kitui",
    "constituencies": [
      {
        "name": "Kitui Central",
        "wards": [
          "Kyangwithya East",
          "Kyangwithya West",
          "Miambani",
          "Mulango",
          "Township"
        ]
      },
      {
        "name": "Kitui East",
        "wards": [
          "Chuluni",
          "Endau/Malalani",
          "Mutito/Kaliku",
          "Nzambani",
          "Voo/Kyamatu",
          "Zombe/Mwitika"
        ]
      },
      {
        "name": "Kitui Rural",
        "wards": [
          "Kanyangi",
          "Kisasi",
          "Kwavonza/Yatta",
          "Mbitini"
        ]
      },
      {
        "name": "Kitui South",
        "wards": [
          "Athi",
          "Ikanga/Kyatune",
          "Ikutha",
          "Kanziko",
          "Mutha",
          "Mutomo"
        ]
      },
      {
        "name": "Kitui West",
        "wards": [
          "Kauwi",
          "Kwa Mutonga/Kithumula",
          "Matinyani",
          "Mutonguni"
        ]
      },
      {
        "name": "Mwingi Central",
        "wards": [
          "Central",
          "Kivou",
          "Mui",
          "Nguni",
          "Nuu",
          "Waita"
        ]
      },
      {
        "name": "Mwingi North",
        "wards": [
          "Kyuso",
          "Mumoni",
          "Ngomeni",
          "Tharaka",
          "Tseikuru"
        ]
      },
      {
        "name": "Mwingi West",
        "wards": [
          "Kiomo/Kyethani",
          "Kyome/Thaana",
          "Migwani",
          "Nguutani"
        ]
      }
    ]
  },
  {
    "name": "Kwale",
    "constituencies": [
      {
        "name": "Kinango",
        "wards": [
          "Chengoni/Samburu",
          "Kasemeni",
          "Kinango",
          "Mackinnon-Road",
          "Mwavumbo",
          "Nadavaya",
          "Puma"
        ]
      },
      {
        "name": "Lungalunga",
        "wards": [
          "Dzombo",
          "Mwereni",
          "Pongwekikoneni",
          "Vanga"
        ]
      },
      {
        "name": "Matuga",
        "wards": [
          "Kubo South",
          "Mkongani",
          "Tiwi",
          "Tsimba Golini",
          "Waa"
        ]
      },
      {
        "name": "Msambweni",
        "wards": [
          "Gombatobongwe",
          "Kinondo",
          "Ramisi",
          "Ukunda"
        ]
      }
    ]
  },
  {
    "name": "Laikipia",
    "constituencies": [
      {
        "name": "Laikipia East",
        "wards": [
          "Nanyuki",
          "Ngobit",
          "Thingithu",
          "Tigithi",
          "Umande"
        ]
      },
      {
        "name": "Laikipia North",
        "wards": [
          "Mukogondo East",
          "Mukogondo West",
          "Segera",
          "Sosian"
        ]
      },
      {
        "name": "Laikipia West",
        "wards": [
          "Igwamiti",
          "Kinamba",
          "Marmanet",
          "Olmoran",
          "Rumuruti Township",
          "Salama"
        ]
      }
    ]
  },
  {
    "name": "Lamu",
    "constituencies": [
      {
        "name": "Lamu East",
        "wards": [
          "Basuba",
          "Faza",
          "Kiunga"
        ]
      },
      {
        "name": "Lamu West",
        "wards": [
          "Bahari",
          "Hindi",
          "Hongwe",
          "Mkomani",
          "Mkunumbi",
          "Shella",
          "Witu"
        ]
      }
    ]
  },
  {
    "name": "Machakos",
    "constituencies": [
      {
        "name": "Kangundo",
        "wards": [
          "Kangundo Central",
          "Kangundo East",
          "Kangundo North",
          "Kangundo West"
        ]
      },
      {
        "name": "Kathiani",
        "wards": [
          "Kathiani Central",
          "Lower Kaewa/Kaani",
          "Mitaboni",
          "Upper Kaewa/Iveti"
        ]
      },
      {
        "name": "Machakos Town",
        "wards": [
          "Kalama",
          "Kola",
          "Machakos Central",
          "Mua",
          "Mumbuni North",
          "Mutituni",
          "Muvuti/Kiima-Kimwe"
        ]
      },
      {
        "name": "Masinga",
        "wards": [
          "Ekalakala",
          "Kivaa",
          "Masinga Central",
          "Muthesya",
          "Ndithini"
        ]
      },
      {
        "name": "Matungulu",
        "wards": [
          "Kyeleni",
          "Matungulu East",
          "Matungulu North",
          "Matungulu West",
          "Tala"
        ]
      },
      {
        "name": "Mavoko",
        "wards": [
          "Athi River",
          "Kinanie",
          "Muthwani",
          "Syokimau/Mulolongo"
        ]
      },
      {
        "name": "Mwala",
        "wards": [
          "Kibauni",
          "Makutano/Mwala",
          "Masii",
          "Mbiuni",
          "Muthetheni",
          "Wamunyu"
        ]
      },
      {
        "name": "Yatta",
        "wards": [
          "Ikombe",
          "Katangi",
          "Kithimani",
          "Matuu",
          "Ndalani"
        ]
      }
    ]
  },
  {
    "name": "Makueni",
    "constituencies": [
      {
        "name": "Kaiti",
        "wards": [
          "Ilima",
          "Kee",
          "Kilungu",
          "Ukia"
        ]
      },
      {
        "name": "Kibwezi East",
        "wards": [
          "Ivingoni/Nzambani",
          "Masongaleni",
          "Mtito Andei",
          "Thange"
        ]
      },
      {
        "name": "Kibwezi West",
        "wards": [
          "Emali/Mulala",
          "Kikumbulyu North",
          "Kikumbulyu South",
          "Makindu",
          "Nguu/Masumba",
          "Nguumo"
        ]
      },
      {
        "name": "Kilome",
        "wards": [
          "Kasikeu",
          "Kiima Kiu/Kalanzoni",
          "Mukaa"
        ]
      },
      {
        "name": "Makueni",
        "wards": [
          "Kathonzweni",
          "Kitise/Kithuki",
          "Mavindini",
          "Mbitini",
          "Muvau/Kikuumini",
          "Nzaui/Kilili/Kalamba",
          "Wote"
        ]
      },
      {
        "name": "Mbooni",
        "wards": [
          "Kalawa",
          "Kisau/Kiteta",
          "Kithungo/Kitundu",
          "Mbooni",
          "Tulimani",
          "Waia/Kako"
        ]
      }
    ]
  },
  {
    "name": "Mandera",
    "constituencies": [
      {
        "name": "Banissa",
        "wards": [
          "Banissa",
          "Derkhale",
          "Guba",
          "Kiliwehiri",
          "Malkamari"
        ]
      },
      {
        "name": "Lafey",
        "wards": [
          "Alungo Gof",
          "Fino",
          "Lafey",
          "Libehia",
          "Warankara"
        ]
      },
      {
        "name": "Mandera East",
        "wards": [
          "Arabia",
          "Bulla Mpya",
          "Khalalio",
          "Neboi",
          "Township"
        ]
      },
      {
        "name": "Mandera North",
        "wards": [
          "Ashabito",
          "Guticha",
          "Morothile",
          "Rhamu",
          "Rhamu-Dimtu"
        ]
      },
      {
        "name": "Mandera South",
        "wards": [
          "Elwak North",
          "Elwak South",
          "Kutulo",
          "Shimbir Fatuma",
          "Wargudud"
        ]
      },
      {
        "name": "Mandera West",
        "wards": [
          "Dandu",
          "Gither",
          "Lag Sure",
          "Takaba",
          "Takaba South"
        ]
      }
    ]
  },
  {
    "name": "Marsabit",
    "constituencies": [
      {
        "name": "Laisamis",
        "wards": [
          "Kargi/South Horr",
          "Korr/Ngurunit",
          "Laisamis",
          "Log Logo",
          "Loiyangalani"
        ]
      },
      {
        "name": "Moyale",
        "wards": [
          "Butiye",
          "Golbo",
          "Heilu-Manyatta",
          "Moyale Township",
          "Obbu",
          "Sololo",
          "Uran"
        ]
      },
      {
        "name": "North Horr",
        "wards": [
          "Dukana",
          "Illeret",
          "Maikona",
          "North Horr",
          "Turbi"
        ]
      },
      {
        "name": "Saku",
        "wards": [
          "Karare",
          "Marsabit Central",
          "Sagante/Jaldesa"
        ]
      }
    ]
  },
  {
    "name": "Meru",
    "constituencies": [
      {
        "name": "Buuri",
        "wards": [
          "Kibirichia",
          "Kiirua/Naari",
          "Kisima",
          "Ruiri/Rwarera",
          "Timau"
        ]
      },
      {
        "name": "Central Imenti",
        "wards": [
          "Abothuguchi Central",
          "Abothuguchi West",
          "Kiagu",
          "Mwanganthia"
        ]
      },
      {
        "name": "Igembe Central",
        "wards": [
          "Akirang'ondu",
          "Athiru Ruujine",
          "Igembe East",
          "Kangeta",
          "Njia"
        ]
      },
      {
        "name": "Igembe North",
        "wards": [
          "Amwathi",
          "Antuambui",
          "Antubetwe Kiongo",
          "Naathu",
          "Ntunene"
        ]
      },
      {
        "name": "Igembe South",
        "wards": [
          "Akachiu",
          "Athiru Gaiti",
          "Kanuni",
          "Kiegoi/Antubochiu",
          "Maua"
        ]
      },
      {
        "name": "North Imenti",
        "wards": [
          "Municipality",
          "Ntima East",
          "Ntima West",
          "Nyaki East",
          "Nyaki West"
        ]
      },
      {
        "name": "South Imenti",
        "wards": [
          "Abogeta East",
          "Abogeta West",
          "Igoji East",
          "Igoji West",
          "Mitunguu",
          "Nkuene"
        ]
      },
      {
        "name": "Tigania East",
        "wards": [
          "Karama",
          "Kiguchwa",
          "Mikinduri",
          "Muthara",
          "Thangatha"
        ]
      },
      {
        "name": "Tigania West",
        "wards": [
          "Akithii",
          "Athwana",
          "Kianjai",
          "Mbeu",
          "Nkomo"
        ]
      }
    ]
  },
  {
    "name": "Migori",
    "constituencies": [
      {
        "name": "Awendo",
        "wards": [
          "Central Sakwa",
          "North Sakwa",
          "South Sakwa",
          "West Sakwa"
        ]
      },
      {
        "name": "Kuria East",
        "wards": [
          "Gokeharaka/Getambwega",
          "Ntimaru East",
          "Ntimaru West",
          "Nyabasi East",
          "Nyabasi West"
        ]
      },
      {
        "name": "Kuria West",
        "wards": [
          "Bukira Centrl/Ikerege",
          "Bukira East",
          "Isibania",
          "Makerero",
          "Masaba",
          "Nyamosense/Komosoko",
          "Tagare"
        ]
      },
      {
        "name": "Nyatike",
        "wards": [
          "Got Kachola",
          "Kachien'g",
          "Kaler",
          "Kanyasa",
          "Macalder/Kanyarwanda",
          "Muhuru",
          "North Kadem"
        ]
      },
      {
        "name": "Rongo",
        "wards": [
          "Central Kamagambo",
          "East Kamagambo",
          "North Kamagambo",
          "South Kamagambo"
        ]
      },
      {
        "name": "Suna East",
        "wards": [
          "God Jope",
          "Kakrao",
          "Kwa",
          "Suna Central"
        ]
      },
      {
        "name": "Suna West",
        "wards": [
          "Ragana-Oruba",
          "Wasimbete",
          "Wasweta II",
          "Wiga"
        ]
      },
      {
        "name": "Uriri",
        "wards": [
          "Central Kanyamkago",
          "East Kanyamkago",
          "North Kanyamkago",
          "South Kanyamkago",
          "West Kanyamkago"
        ]
      }
    ]
  },
  {
    "name": "Mombasa",
    "constituencies": [
      {
        "name": "Changamwe",
        "wards": [
          "Airport",
          "Chaani",
          "Changamwe",
          "Kipevu",
          "Port Reitz"
        ]
      },
      {
        "name": "Jomvu",
        "wards": [
          "Jomvu Kuu",
          "Mikindani",
          "Miritini"
        ]
      },
      {
        "name": "Kisauni",
        "wards": [
          "Bamburi",
          "Junda",
          "Magogoni",
          "Mjambere",
          "Mtopanga",
          "Mwakirunge",
          "Shanzu"
        ]
      },
      {
        "name": "Likoni",
        "wards": [
          "Bofu",
          "Likoni",
          "Mtongwe",
          "Shika Adabu",
          "Timbwani"
        ]
      },
      {
        "name": "Mvita",
        "wards": [
          "Majengo",
          "Mji Wa Kale/Makadara",
          "Shimanzi/Ganjoni",
          "Tononoka",
          "Tudor"
        ]
      },
      {
        "name": "Nyali",
        "wards": [
          "Frere Town",
          "Kadzandani",
          "Kongowea",
          "Mkomani",
          "Ziwa La Ng'ombe"
        ]
      }
    ]
  },
  {
    "name": "Murang'a",
    "constituencies": [
      {
        "name": "Gatanga",
        "wards": [
          "Gatanga",
          "Ithanga",
          "Kakuzi/Mitubiri",
          "Kariara",
          "Kihumbu-Ini",
          "Mugumo-Ini"
        ]
      },
      {
        "name": "Kandara",
        "wards": [
          "Gaichanjiru",
          "Ithiru",
          "Kagundu-Ini",
          "Muruka",
          "Ng'araria",
          "Ruchu"
        ]
      },
      {
        "name": "Kangema",
        "wards": [
          "Kanyenyaini",
          "Muguru",
          "Rwathia"
        ]
      },
      {
        "name": "Kigumo",
        "wards": [
          "Kahumbu",
          "Kangari",
          "Kigumo",
          "Kinyona",
          "Muthithi"
        ]
      },
      {
        "name": "Kiharu",
        "wards": [
          "Gaturi",
          "Mbiri",
          "Mugoiri",
          "Murarandia",
          "Township",
          "Wangu"
        ]
      },
      {
        "name": "Maragwa",
        "wards": [
          "Ichagaki",
          "Kamahuha",
          "Kambiti",
          "Kimorori/Wempa",
          "Makuyu",
          "Nginda"
        ]
      },
      {
        "name": "Mathioya",
        "wards": [
          "Gitugi",
          "Kamacharia",
          "Kiru"
        ]
      }
    ]
  },
  {
    "name": "Nairobi",
    "constituencies": [
      {
        "name": "Dagoretti North",
        "wards": [
          "Gatina",
          "Kabiro",
          "Kawangware",
          "Kileleshwa",
          "Kilimani"
        ]
      },
      {
        "name": "Dagoretti South",
        "wards": [
          "Mutuini",
          "Ngando",
          "Riruta",
          "Uthiru/Ruthimitu",
          "Waithaka"
        ]
      },
      {
        "name": "Embakasi Central",
        "wards": [
          "Kayole Central",
          "Kayole North",
          "Kayole South",
          "Komarock",
          "Matopeni"
        ]
      },
      {
        "name": "Embakasi East",
        "wards": [
          "Embakasi",
          "Lower Savannah",
          "Mihango",
          "Upper Savannah",
          "Utawala"
        ]
      },
      {
        "name": "Embakasi North",
        "wards": [
          "Dandora Area I",
          "Dandora Area II",
          "Dandora Area III",
          "Dandora Area IV",
          "Kariobangi North"
        ]
      },
      {
        "name": "Embakasi South",
        "wards": [
          "Imara Daima",
          "Kwa Njenga",
          "Kwa Reuben",
          "Kware",
          "Pipeline"
        ]
      },
      {
        "name": "Embakasi West",
        "wards": [
          "Kariobangi South",
          "Mowlem",
          "Umoja I",
          "Umoja II"
        ]
      },
      {
        "name": "Kamukunji",
        "wards": [
          "Airbase",
          "California",
          "Eastleigh North",
          "Eastleigh South",
          "Pumwani"
        ]
      },
      {
        "name": "Kasarani",
        "wards": [
          "Claycity",
          "Kasarani",
          "Mwiki",
          "Njiru",
          "Ruai"
        ]
      },
      {
        "name": "Kibra",
        "wards": [
          "Laini Saba",
          "Lindi",
          "Makina",
          "Sarangombe",
          "Woodley/Kenyatta Golf"
        ]
      },
      {
        "name": "Langata",
        "wards": [
          "Karen",
          "Mugumo-Ini",
          "Nairobi West",
          "Nyayo Highrise",
          "South-C"
        ]
      },
      {
        "name": "Makadara",
        "wards": [
          "Harambee",
          "Makongeni",
          "Maringo/Hamza",
          "Viwandani"
        ]
      },
      {
        "name": "Mathare",
        "wards": [
          "Hospital",
          "Huruma",
          "Kiamaiko",
          "Mabatini",
          "Mlango Kubwa",
          "Ngei"
        ]
      },
      {
        "name": "Roysambu",
        "wards": [
          "Githurai",
          "Kahawa",
          "Kahawa West",
          "Roysambu",
          "Zimmerman"
        ]
      },
      {
        "name": "Ruaraka",
        "wards": [
          "Baba Dogo",
          "Korogocho",
          "Lucky Summer",
          "Mathare North",
          "Utalii"
        ]
      },
      {
        "name": "Starehe",
        "wards": [
          "Landimawe",
          "Nairobi Central",
          "Nairobi South",
          "Ngara",
          "Pangani",
          "Ziwani/Kariokor"
        ]
      },
      {
        "name": "Westlands",
        "wards": [
          "Kangemi",
          "Karura",
          "Kitisuru",
          "Mountain View",
          "Parklands/Highridge"
        ]
      }
    ]
  },
  {
    "name": "Nakuru",
    "constituencies": [
      {
        "name": "Bahati",
        "wards": [
          "Bahati",
          "Dundori",
          "Kabatini",
          "Kiamaina",
          "Lanet/Umoja"
        ]
      },
      {
        "name": "Gilgil",
        "wards": [
          "Elementaita",
          "Gilgil",
          "Malewa West",
          "Mbaruk/Eburu",
          "Murindati"
        ]
      },
      {
        "name": "Kuresoi North",
        "wards": [
          "Kamara",
          "Kiptororo",
          "Nyota",
          "Sirikwa"
        ]
      },
      {
        "name": "Kuresoi South",
        "wards": [
          "Amalo",
          "Keringet",
          "Kiptagich",
          "Tinet"
        ]
      },
      {
        "name": "Molo",
        "wards": [
          "Elburgon",
          "Mariashoni",
          "Molo",
          "Turi"
        ]
      },
      {
        "name": "Naivasha",
        "wards": [
          "Biashara",
          "Hells Gate",
          "Lakeview",
          "Maai-Mahiu",
          "Maiella",
          "Naivasha East",
          "Olkaria",
          "Viwandani"
        ]
      },
      {
        "name": "Nakuru Town East",
        "wards": [
          "Biashara",
          "Flamingo",
          "Kivumbini",
          "Menengai",
          "Nakuru East"
        ]
      },
      {
        "name": "Nakuru Town West",
        "wards": [
          "Barut",
          "Kapkures",
          "Kaptembwo",
          "London",
          "Rhoda",
          "Shaabab"
        ]
      },
      {
        "name": "Njoro",
        "wards": [
          "Kihingo",
          "Lare",
          "Mauche",
          "Maunarok",
          "Nessuit",
          "Njoro"
        ]
      },
      {
        "name": "Rongai",
        "wards": [
          "Menengai West",
          "Mosop",
          "Soin",
          "Solai",
          "Visoi"
        ]
      },
      {
        "name": "Subukia",
        "wards": [
          "Kabazi",
          "Subukia",
          "Waseges"
        ]
      }
    ]
  },
  {
    "name": "Nandi",
    "constituencies": [
      {
        "name": "Aldai",
        "wards": [
          "Kabwareng",
          "Kaptumo-Kaboi",
          "Kemeloi-Maraba",
          "Kobujoi",
          "Koyo-Ndurio",
          "Terik"
        ]
      },
      {
        "name": "Chesumei",
        "wards": [
          "Chemundu/Kapng'etuny",
          "Kaptel/Kamoiywo",
          "Kiptuya",
          "Kosirai",
          "Lelmokwo/Ngechek"
        ]
      },
      {
        "name": "Emgwen",
        "wards": [
          "Chepkumia",
          "Kapkangani",
          "Kapsabet",
          "Kilibwoni"
        ]
      },
      {
        "name": "Mosop",
        "wards": [
          "Chepterwai",
          "Kabisaga",
          "Kabiyet",
          "Kipkaren",
          "Kurgung/Surungai",
          "Ndalat",
          "Sangalo/Kebulonik"
        ]
      },
      {
        "name": "Nandi Hills",
        "wards": [
          "Chepkunyuk",
          "Kapchorua",
          "Nandi Hills",
          "Ol'lessos"
        ]
      },
      {
        "name": "Tinderet",
        "wards": [
          "Chemelil/Chemase",
          "Kapsimotwo",
          "Songhor/Soba",
          "Tindiret"
        ]
      }
    ]
  },
  {
    "name": "Narok",
    "constituencies": [
      {
        "name": "Emurua Dikirr",
        "wards": [
          "Ilkerin",
          "Kapsasian",
          "Mogondo",
          "Ololmasani"
        ]
      },
      {
        "name": "Kilgoris",
        "wards": [
          "Angata Barikoi",
          "Keyian",
          "Kilgoris Central",
          "Kimintet",
          "Lolgorian",
          "Shankoe"
        ]
      },
      {
        "name": "Narok East",
        "wards": [
          "Ildamat",
          "Keekonyokie",
          "Mosiro",
          "Suswa"
        ]
      },
      {
        "name": "Narok North",
        "wards": [
          "Melili",
          "Narok Town",
          "Nkareta",
          "Olokurto",
          "Olorropil",
          "Olpusimoru"
        ]
      },
      {
        "name": "Narok South",
        "wards": [
          "Loita",
          "Majimoto/Naroosura",
          "Melelo",
          "Ololulung'a",
          "Sagamian",
          "Sogoo"
        ]
      },
      {
        "name": "Narok West",
        "wards": [
          "Ilmotiok",
          "Mara",
          "Naikarra",
          "Siana"
        ]
      }
    ]
  },
  {
    "name": "Nyandarua",
    "constituencies": [
      {
        "name": "Kinangop",
        "wards": [
          "Engineer",
          "Gathara",
          "Githabai",
          "Magumu",
          "Murungaru",
          "Njabini/Kiburu",
          "North Kinangop",
          "Nyakio"
        ]
      },
      {
        "name": "Kipipiri",
        "wards": [
          "Geta",
          "Githioro",
          "Kipipiri",
          "Wanjohi"
        ]
      },
      {
        "name": "Ndaragwa",
        "wards": [
          "Central",
          "Kiriita",
          "Leshau Pondo",
          "Shamata"
        ]
      },
      {
        "name": "Ol Jorok",
        "wards": [
          "Charagita",
          "Gathanji",
          "Gatimu",
          "Weru"
        ]
      },
      {
        "name": "Ol Kalou",
        "wards": [
          "Kaimbaga",
          "Kanjuiri Ridge",
          "Karau",
          "Mirangine",
          "Rurii"
        ]
      }
    ]
  },
  {
    "name": "Nyamira",
    "constituencies": [
      {
        "name": "Borabu",
        "wards": [
          "Esise",
          "Kiabonyoru",
          "Mekenene",
          "Nyansiongo"
        ]
      },
      {
        "name": "Kitutu Masaba",
        "wards": [
          "Gachuba",
          "Gesima",
          "Kemera",
          "Magombo",
          "Manga",
          "Rigoma"
        ]
      },
      {
        "name": "North Mugirango",
        "wards": [
          "Bokeira",
          "Bomwagamo",
          "Ekerenyo",
          "Itibo",
          "Magwagwa"
        ]
      },
      {
        "name": "West Mugirango",
        "wards": [
          "Bogichora",
          "Bonyamatuta",
          "Bosamaro",
          "Nyamaiya",
          "Township"
        ]
      }
    ]
  },
  {
    "name": "Nyeri",
    "constituencies": [
      {
        "name": "Kieni",
        "wards": [
          "Gakawa",
          "Gatarakwa",
          "Kabaru",
          "Mugunda",
          "Mweiga",
          "Mwiyogo/Endarasha",
          "Naromoru Kiamathaga",
          "Thegu River"
        ]
      },
      {
        "name": "Mathira",
        "wards": [
          "Iriaini",
          "Karatina Town",
          "Kirimukuyu",
          "Konyu",
          "Magutu",
          "Ruguru"
        ]
      },
      {
        "name": "Mukurweini",
        "wards": [
          "Gikondi",
          "Mukurwe-Ini Central",
          "Mukurwe-Ini West",
          "Rugi"
        ]
      },
      {
        "name": "Nyeri Town",
        "wards": [
          "Gatitu/Muruguru",
          "Kamakwa/Mukaro",
          "Kiganjo/Mathari",
          "Ruring'u",
          "Rware"
        ]
      },
      {
        "name": "Othaya",
        "wards": [
          "Chinga",
          "Iria-Ini",
          "Karima",
          "Mahiga"
        ]
      },
      {
        "name": "Tetu",
        "wards": [
          "Aguthi/Gaaki",
          "Dedan Kimanthi",
          "Wamagana"
        ]
      }
    ]
  },
  {
    "name": "Samburu",
    "constituencies": [
      {
        "name": "Samburu East",
        "wards": [
          "Wamba East",
          "Wamba North",
          "Wamba West",
          "Waso"
        ]
      },
      {
        "name": "Samburu North",
        "wards": [
          "Angata Nanyokie",
          "Baawa",
          "El-Barta",
          "Nachola",
          "Ndoto",
          "Nyiro"
        ]
      },
      {
        "name": "Samburu West",
        "wards": [
          "Lodokejek",
          "Loosuk",
          "Maralal",
          "Poro",
          "Suguta Marmar"
        ]
      }
    ]
  },
  {
    "name": "Siaya",
    "constituencies": [
      {
        "name": "Alego Usonga",
        "wards": [
          "Central Alego",
          "North Alego",
          "Siaya Township",
          "South East Alego",
          "Usonga",
          "West Alego"
        ]
      },
      {
        "name": "Bondo",
        "wards": [
          "Central Sakwa",
          "North Sakwa",
          "South Sakwa",
          "West Sakwa",
          "West Yimbo",
          "Yimbo East"
        ]
      },
      {
        "name": "Gem",
        "wards": [
          "Central Gem",
          "East Gem",
          "North Gem",
          "South Gem",
          "West Gem",
          "Yala Township"
        ]
      },
      {
        "name": "Rarieda",
        "wards": [
          "East Asembo",
          "North Uyoma",
          "South Uyoma",
          "West Asembo",
          "West Uyoma"
        ]
      },
      {
        "name": "Ugenya",
        "wards": [
          "East Ugenya",
          "North Ugenya",
          "Ukwala",
          "West Ugenya"
        ]
      },
      {
        "name": "Ugunja",
        "wards": [
          "Sidindi",
          "Sigomere",
          "Ugunja"
        ]
      }
    ]
  },
  {
    "name": "Taita-Taveta",
    "constituencies": [
      {
        "name": "Mwatate",
        "wards": [
          "Bura",
          "Chawia",
          "Mwatate",
          "Rong'e",
          "Wusi/Kishamba"
        ]
      },
      {
        "name": "Taveta",
        "wards": [
          "Bomeni",
          "Chala",
          "Mahoo",
          "Mata",
          "Mboghoni"
        ]
      },
      {
        "name": "Voi",
        "wards": [
          "Kaloleni",
          "Kasigau",
          "Marungu",
          "Mbololo",
          "Ngolia",
          "Sagalla"
        ]
      },
      {
        "name": "Wundanyi",
        "wards": [
          "Mwanda/Mgange",
          "Werugha",
          "Wumingu/Kishushe",
          "Wundanyi/Mbale"
        ]
      }
    ]
  },
  {
    "name": "Tana River",
    "constituencies": [
      {
        "name": "Bura",
        "wards": [
          "Bangale",
          "Bura",
          "Chewele",
          "Madogo",
          "Sala"
        ]
      },
      {
        "name": "Galole",
        "wards": [
          "Chewani",
          "Kinakomba",
          "Mikinduni",
          "Wayu"
        ]
      },
      {
        "name": "Garsen",
        "wards": [
          "Garsen Central",
          "Garsen North",
          "Garsen South",
          "Garsen West",
          "Kipini East",
          "Kipini West"
        ]
      }
    ]
  },
  {
    "name": "Tharaka-Nithi",
    "constituencies": [
      {
        "name": "Chuka/Igambang'ombe",
        "wards": [
          "Igambang'ombe",
          "Karingani",
          "Magumoni",
          "Mariani",
          "Mugwe"
        ]
      },
      {
        "name": "Maara",
        "wards": [
          "Chogoria",
          "Ganga",
          "Mitheru",
          "Muthambi",
          "Mwimbi"
        ]
      },
      {
        "name": "Tharaka",
        "wards": [
          "Chiakariga",
          "Gatunga",
          "Marimanti",
          "Mukothima",
          "Nkondi"
        ]
      }
    ]
  },
  {
    "name": "Trans Nzoia",
    "constituencies": [
      {
        "name": "Cherangany",
        "wards": [
          "Chepsiro/Kiptoror",
          "Cherangany/Suwerwa",
          "Kaplamai",
          "Makutano",
          "Motosiet",
          "Sinyerere",
          "Sitatunga"
        ]
      },
      {
        "name": "Endebess",
        "wards": [
          "Chepchoina",
          "Endebess",
          "Matumbei"
        ]
      },
      {
        "name": "Kiminini",
        "wards": [
          "Hospital",
          "Kiminini",
          "Nabiswa",
          "Sikhendu",
          "Sirende",
          "Waitaluk"
        ]
      },
      {
        "name": "Kwanza",
        "wards": [
          "Bidii",
          "Kapomboi",
          "Keiyo",
          "Kwanza"
        ]
      },
      {
        "name": "Saboti",
        "wards": [
          "Kinyoro",
          "Machewa",
          "Matisi",
          "Saboti",
          "Tuwani"
        ]
      }
    ]
  },
  {
    "name": "Turkana",
    "constituencies": [
      {
        "name": "Loima",
        "wards": [
          "Kotaruk/Lobei",
          "Loima",
          "Lokiriama/Lorengippi",
          "Turkwel"
        ]
      },
      {
        "name": "Turkana Central",
        "wards": [
          "Kalokol",
          "Kanamkemer",
          "Kang'atotha",
          "Kerio Delta",
          "Lodwar Township"
        ]
      },
      {
        "name": "Turkana East",
        "wards": [
          "Kapedo/Napeitom",
          "Katilia",
          "Lokori/Kochodin"
        ]
      },
      {
        "name": "Turkana North",
        "wards": [
          "Kaaleng/Kaikor",
          "Kaeris",
          "Kibish",
          "Lake Zone",
          "Lapur",
          "Nakalale"
        ]
      },
      {
        "name": "Turkana South",
        "wards": [
          "Kalapata",
          "Kaputir",
          "Katilu",
          "Lobokat",
          "Lokichar"
        ]
      },
      {
        "name": "Turkana West",
        "wards": [
          "Kakuma",
          "Kalobeyei",
          "Letea",
          "Lokichoggio",
          "Lopur",
          "Nanaam",
          "Songot"
        ]
      }
    ]
  },
  {
    "name": "Uasin Gishu",
    "constituencies": [
      {
        "name": "Ainabkoi",
        "wards": [
          "Ainabkoi/Olare",
          "Kapsoya",
          "Kaptagat"
        ]
      },
      {
        "name": "Kapseret",
        "wards": [
          "Kipkenyo",
          "Langas",
          "Megun",
          "Ngeria",
          "Simat/Kapseret"
        ]
      },
      {
        "name": "Kesses",
        "wards": [
          "Cheptiret/Kipchamo",
          "Racecourse",
          "Tarakwa",
          "Tulwet/Chuiyat"
        ]
      },
      {
        "name": "Moiben",
        "wards": [
          "Karuna/Meibeki",
          "Kimumu",
          "Moiben",
          "Sergoit",
          "Tembelio"
        ]
      },
      {
        "name": "Soy",
        "wards": [
          "Kapkures",
          "Kipsomba",
          "Kuinet/Kapsuswa",
          "Moi's Bridge",
          "Segero/Barsombe",
          "Soy",
          "Ziwa"
        ]
      },
      {
        "name": "Turbo",
        "wards": [
          "Huruma",
          "Kamagut",
          "Kapsaos",
          "Kiplombe",
          "Ngenyilel",
          "Tapsagoi"
        ]
      }
    ]
  },
  {
    "name": "Vihiga",
    "constituencies": [
      {
        "name": "Emuhaya",
        "wards": [
          "Central Bunyore",
          "North East Bunyore",
          "West Bunyore"
        ]
      },
      {
        "name": "Hamisi",
        "wards": [
          "Banja",
          "Gisambai",
          "Jepkoyai",
          "Muhudu",
          "Shamakhokho",
          "Shiru",
          "Tambua"
        ]
      },
      {
        "name": "Luanda",
        "wards": [
          "Emabungo",
          "Luanda South",
          "Luanda Township",
          "Mwibona",
          "Wemilabi"
        ]
      },
      {
        "name": "Sabatia",
        "wards": [
          "Busali",
          "Chavakali",
          "Lyaduywa/Izava",
          "North Maragoli",
          "West Sabatia",
          "Wodanga"
        ]
      },
      {
        "name": "Vihiga",
        "wards": [
          "Central Maragoli",
          "Lugaga-Wamuluma",
          "Mungoma",
          "South Maragoli"
        ]
      }
    ]
  },
  {
    "name": "Wajir",
    "constituencies": [
      {
        "name": "Eldas",
        "wards": [
          "Della",
          "Eldas",
          "Elnur/Tula Tula",
          "Lakoley South/Basir"
        ]
      },
      {
        "name": "Tarbaj",
        "wards": [
          "Elben",
          "Sarman",
          "Tarbaj",
          "Wargadud"
        ]
      },
      {
        "name": "Wajir East",
        "wards": [
          "Barwago",
          "Khorof/Harar",
          "Township",
          "Wagberi"
        ]
      },
      {
        "name": "Wajir North",
        "wards": [
          "Batalu",
          "Bute",
          "Danaba",
          "Godoma",
          "Gurar",
          "Korondile",
          "Malkagufu"
        ]
      },
      {
        "name": "Wajir South",
        "wards": [
          "Benane",
          "Burder",
          "Dadaja Bulla",
          "Diif",
          "Habasswein",
          "Ibrahim Ure",
          "Lagboghol South"
        ]
      },
      {
        "name": "Wajir West",
        "wards": [
          "Ademasajide",
          "Arbajahan",
          "Hadado/Athibohol",
          "Wagalla/Ganyure"
        ]
      }
    ]
  },
  {
    "name": "West Pokot",
    "constituencies": [
      {
        "name": "Kacheliba",
        "wards": [
          "Alale",
          "Kapckok",
          "Kasei",
          "Kiwawa",
          "Kodich",
          "Suam"
        ]
      },
      {
        "name": "Kapenguria",
        "wards": [
          "Endugh",
          "Kapenguria",
          "Mnagei",
          "Riwo",
          "Siyoi",
          "Sook"
        ]
      },
      {
        "name": "Pokot South",
        "wards": [
          "Batei",
          "Chepareria",
          "Lelan",
          "Tapach"
        ]
      },
      {
        "name": "Sigor",
        "wards": [
          "Lomut",
          "Masool",
          "Sekerr",
          "Weiwei"
        ]
      }
    ]
  }
];

export const COUNTIES: County[] = RAW.map((c) => ({
  name: c.name,
  constituencies: c.constituencies.map((x) => x.name),
}));

export const COUNTY_NAMES: string[] = COUNTIES.map((c) => c.name);

const CONSTITUENCY_INDEX: Map<string, ConstituencyRecord> = new Map();
for (const county of RAW) {
  for (const con of county.constituencies) {
    CONSTITUENCY_INDEX.set(con.name, { name: con.name, county: county.name, wards: con.wards });
  }
}

export const ALL_CONSTITUENCIES: { county: string; name: string }[] = RAW.flatMap((c) =>
  c.constituencies.map((con) => ({ county: c.name, name: con.name })),
);

export function wardsForConstituency(constituency: string): string[] {
  return CONSTITUENCY_INDEX.get(constituency)?.wards ?? [];
}

export const ALL_WARDS: { county: string; constituency: string; name: string }[] = RAW.flatMap(
  (c) =>
    c.constituencies.flatMap((con) =>
      con.wards.map((w) => ({ county: c.name, constituency: con.name, name: w })),
    ),
);

export const TOTAL_COUNTIES = COUNTIES.length; // 47
export const TOTAL_CONSTITUENCIES = ALL_CONSTITUENCIES.length; // 290
export const TOTAL_WARDS = ALL_WARDS.length; // 1,448

export function constituenciesForCounty(county: string): string[] {
  return COUNTIES.find((c) => c.name === county)?.constituencies ?? [];
}
