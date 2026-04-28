// Full Nairobi locations list
const nairobiLocations = [
  // Central / CBD
  { area: 'CBD', sub: ['Nairobi CBD', 'City Hall', 'River Road', 'Tom Mboya Street', 'Moi Avenue'] },

  // Westside
  { area: 'Westlands', sub: ['Westlands', 'Mpaka Road', 'Riverside Drive', 'Brookside', 'Peponi', 'Woodvale Grove'] },
  { area: 'Kilimani', sub: ['Kilimani', 'Kirichwa Road', 'Argwings Kodhek', 'Lenana Road'] },
  { area: 'Lavington', sub: ['Lavington', 'Lower Kabete Road', 'James Gichuru Road'] },
  { area: 'Kileleshwa', sub: ['Kileleshwa', 'Othaya Road', 'Elgeyo Marakwet Road'] },
  { area: 'Parklands', sub: ['Parklands', 'Highridge', 'Ngara', '3rd Parklands Avenue', '6th Parklands Avenue'] },
  { area: 'Spring Valley', sub: ['Spring Valley', 'Loresho', 'Kangemi'] },
  { area: 'Hurlingham', sub: ['Hurlingham', 'Adams Arcade', 'Argwings Kodhek Rd'] },

  // Upmarket North
  { area: 'Runda', sub: ['Runda', 'Runda Mumwe', 'Old Runda'] },
  { area: 'Muthaiga', sub: ['Muthaiga', 'Lower Muthaiga', 'New Muthaiga'] },
  { area: 'Gigiri', sub: ['Gigiri', 'Limuru Road', 'UN Area'] },
  { area: 'Ridgeways', sub: ['Ridgeways', 'Mirema', 'Garden Estate', 'Clay City'] },
  { area: 'Rosslyn', sub: ['Rosslyn', 'Rosslyn Valley'] },

  // Karen / Langata
  { area: 'Karen', sub: ['Karen', 'Karen Hardy', 'Karen C', 'Langata', 'Nairobi West'] },
  { area: 'South B / South C', sub: ['South B', 'South C', 'Mugoya Estate'] },
  { area: 'Ngumo / Woodley', sub: ['Ngumo', 'Woodley', 'Jamhuri', 'Nairobi West'] },

  // Thika Road Corridor
  { area: 'Kasarani', sub: ['Kasarani', 'Mwiki', 'Clay City', 'Sunton', 'Seasons'] },
  { area: 'Roysambu', sub: ['Roysambu', 'TRM Area', 'Zimmerman', 'Lucky Summer'] },
  { area: 'Kahawa', sub: ['Kahawa West', 'Kahawa Sukari', 'Kahawa Station'] },
  { area: 'Githurai', sub: ['Githurai 44', 'Githurai 45', 'Kamiti Road'] },
  { area: 'Ruaraka', sub: ['Ruaraka', 'Babadogo', 'Majimaji', 'GSU Area'] },
  { area: 'Garden Estate', sub: ['Garden Estate', 'Drive In Area', 'Mirema Drive'] },

  // Eastlands
  { area: 'Eastleigh', sub: ['Eastleigh Section 1', 'Eastleigh Section 2', 'Eastleigh Section 3', 'California Estate'] },
  { area: 'Buruburu', sub: ['Buruburu Phase 1', 'Buruburu Phase 2', 'Buruburu Phase 3', 'Buruburu Phase 4', 'Buruburu Phase 5'] },
  { area: 'Umoja', sub: ['Umoja 1', 'Umoja 2', 'Umoja Inner Core', 'Mowlem'] },
  { area: 'Donholm', sub: ['Donholm', 'Fedha Estate', 'Greenfield'] },
  { area: 'Komarock', sub: ['Komarock Phase 1', 'Komarock Phase 2', 'Komarock Phase 3', 'Komarock Phase 4'] },
  { area: 'Kayole', sub: ['Kayole', 'Kayole North', 'Kayole South', 'Soweto Estate'] },
  { area: 'Dandora', sub: ['Dandora Phase 1', 'Dandora Phase 2', 'Dandora Phase 3', 'Dandora Phase 4'] },
  { area: 'Kariobangi', sub: ['Kariobangi North', 'Kariobangi South'] },
  { area: 'Embakasi', sub: ['Embakasi', 'Imara Daima', 'Pipeline', 'Nyayo Estate', 'Savannah Estate'] },
  { area: 'Makadara', sub: ['Makadara', 'Ofafa Jericho', 'Bahati', 'Jerusalem Estate'] },

  // Mathare / Huruma
  { area: 'Mathare / Huruma', sub: ['Mathare', 'Huruma', 'Ngei Estate', 'Mabatini'] },

  // Ngong Road Corridor
  { area: 'Ngong Road', sub: ['Ngong Road', 'Valley Arcade', 'Prestige', 'Adams Arcade', 'T-Mall Area'] },
  { area: 'Dagoretti', sub: ['Dagoretti', 'Kabete', 'Ruthimitu', 'Uthiru', 'Waithaka'] },

  // Satellite Towns
  { area: 'Ruaka', sub: ['Ruaka', 'Banana', 'Ndenderu', 'Kiambu Road'] },
  { area: 'Rongai', sub: ['Rongai', 'Ongata Rongai', 'Rimpa', 'Nkoroi', 'Classique Area'] },
  { area: 'Ngong', sub: ['Ngong Town', 'Ngong Hills', 'Kibichiku', 'Kibiko'] },
  { area: 'Syokimau / Mlolongo', sub: ['Syokimau', 'Mlolongo', 'Mombasa Road Area'] },
  { area: 'Kitengela', sub: ['Kitengela', 'Acacia', 'Milimani', 'Red Hill'] },
  { area: 'Athi River', sub: ['Athi River', 'Mavoko', 'EPZ Area', 'Kanuku'] },
  { area: 'Juja', sub: ['Juja', 'Juja Farm', 'Kalimoni', 'Murera'] },
  { area: 'Ruiru', sub: ['Ruiru', 'Tatu City', 'Eastern Bypass Area', 'Kimbo'] },
  { area: 'Kikuyu', sub: ['Kikuyu', 'Kinoo', 'Wangige', 'Ondiri'] },
  { area: 'Limuru', sub: ['Limuru', 'Tigoni', 'Ndeiya'] },

  // Upper Hill / Industrial
  { area: 'Upper Hill', sub: ['Upper Hill', 'Bishops Road', 'Hill Park'] },
  { area: 'Industrial Area', sub: ['Industrial Area', 'Enterprise Road', 'Likoni Road'] },
  { area: 'Eastleigh Industrial', sub: ['Gikomba', 'Kamukunji', 'Pumwani'] },
];

// Flatten to simple list for dropdowns
const allLocations = nairobiLocations.flatMap(l => l.sub);

module.exports = { nairobiLocations, allLocations };
