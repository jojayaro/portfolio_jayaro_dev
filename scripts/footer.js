class Footer extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      const response = await fetch("pages/footer.html");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      this.innerHTML = data;
    } catch (error) {
      console.error("Error loading footer:", error);
    }
  }
}

customElements.define("footer-component", Footer);
