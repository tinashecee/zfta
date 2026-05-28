import { component$ } from "@builder.io/qwik";
import { TournamentClassificationSelect } from "~/components/application-form/tournament-classification-select";
import { APPLICATION_TYPES } from "~/lib/application-types";

/** Incoming tour: country/org (1.3), accommodation (1.7), purpose (1.6), tour & travel dates. */
export const IncomingTourDetailsSection = component$(() => {
  const minLeadDays = APPLICATION_TYPES.incoming_tour.minLeadDays;
  const COUNTRIES = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Cote d’Ivoire",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czechia (Czech Republic)",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini (fmr. Swaziland)",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Holy See",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (formerly Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States of America",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ] as const;

  return (
    <>
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-4 sticky top-24">
          <h2 class="text-2xl font-bold font-headline text-primary mb-2">Tour &amp; travel dates</h2>
          <p class="text-sm text-on-surface-variant leading-relaxed">
            Tour event window and when the visiting party arrives in and departs from Zimbabwe. Arrival must be at
            least {minLeadDays} days from today.
          </p>
        </div>

        <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Tour start date</label>
              <input
                name="tour_start_date"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                type="date"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Tour end date</label>
              <input
                name="tour_end_date"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                type="date"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Arrival date</label>
              <input
                name="incoming_arrival_date"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                type="date"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">Departure date</label>
              <input
                name="incoming_departure_date"
                class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
                type="date"
                required
              />
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div class="lg:col-span-4 sticky top-24">
        <h2 class="text-2xl font-bold font-headline text-primary mb-2">Incoming tour details</h2>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          Country represented by the touring party, accommodation establishment in Zimbabwe, and optional purpose/benefits.
        </p>
      </div>

      <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 space-y-6">
        <TournamentClassificationSelect />

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
            Country represented
          </label>
          <select
            name="represented_country"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            required
          >
            <option value="">— Select —</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
            Accommodation establishment in Zimbabwe (1.7)
          </label>
          <input
            name="training_facility_name"
            class="w-full bg-surface-container-highest border-none rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="Hotel / facility where touring party will stay"
            type="text"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-sm font-semibold font-label text-on-surface-variant ml-1">
            Purpose or benefits of hosting the tour (optional)
          </label>
          <textarea
            name="event_description"
            class="w-full min-h-[120px] bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary/30 transition-all font-body"
            placeholder="Describe the purpose and expected benefits."
          />
        </div>
      </div>
    </section>
    </>
  );
});
