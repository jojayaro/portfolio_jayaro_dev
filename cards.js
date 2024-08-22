const cardData = [
    { title: "Bt/Bz", id: "bz" },
    { title: "Magnetometer", id: "magnetometer" },
    { title: "Density", id: "density" },
    { title: "Speed", id: "speed" },
    { title: "Temperature", id: "temp" },
    { title: "Kyoto Dst", id: "dst" }
  ];

  function createCards() {
    const container = document.getElementById('cardContainer');
    cardData.forEach(card => {
      const cardHTML = `
        <div class="card w-80 bg-base-300 shadow-xl mx-auto">
          <div class="card-body">
            <div class="">
              <div style="display: flex; justify-content: space-between;">
                <span>${card.title}</span>
                <div id="last_${card.id}"></div>
              </div>
              <div id="${card.id}_chart"></div>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += cardHTML;
    });
  }

  document.addEventListener('DOMContentLoaded', createCards);