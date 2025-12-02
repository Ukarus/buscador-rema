// import indicadores_data from './public/indicadores_data.json' assert { type: 'json' };

   const EXCEL_URL = '/Modelo.xlsx';

    async function loadXlsx(url) {
      /* perform network request */
      let response;
      try {
        response = await fetch(url);
      } catch (e) {
        /* network error */
        throw new Error(`Network Error: ${e.message}`);
      }

      /* check status code */
      if (response.status == 404) {
        /* server 404 error -- file not found */
        throw new Error("File not found");
      }
      if (response.status != 200) {
        /* for most servers, a successful response will have status 200 */
        throw new Error(`Server status ${response.status}: ${response.statusText}`);
      }

      /* get data */
      let arrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        return workbook;
      } catch (e) {
        /* data error */
        throw new Error(`Data Error: ${e.message}`);
      }
    }


    document.addEventListener('alpine:init', () => {
      Alpine.data('indicadores', () => ({
        items: [],
        query: '',
        iframeURL: '',
        minisearch: null,
        iframeObject: {
          embedId: '',
          title: '',
          embedSrc: '',
        },
        iconMap: {
          'Mapa': 'bi bi-map',
          'Texto': 'bi bi-file-text',
          'Indicador': 'bi bi-bar-chart',
          'Economía Circular': 'bi bi-arrow-clockwise',
        },
        page: {
          currentPage: 1,
          pageSize: 5,
        },
        async getXlsxData() {
          const workbook = await loadXlsx(EXCEL_URL);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          return jsonData;
        },
        init() {
          this.getXlsxData().then(data => {
            const dataWithIds = data.map((item, index) => ({
              id: index + 1,
              ...item
            }));
            this.items = dataWithIds;
            console.log(dataWithIds);
            this.minisearch = new MiniSearch({
              fields: ['Nombre', 'Categoría'],
              storeFields: ['Nombre', 'Tipo', 'Capítulo', 'Categoría', 'Fuente', 'Enlace'],

            });
            this.minisearch.addAll(dataWithIds);
          });

          const myModalEl = document.getElementById('myModal')
          // Limpia el iframe al cerrar el modal
          myModalEl.addEventListener('hidden.bs.modal', event => {
            this.iframeURL = '';
            document.getElementById(this.iframeObject.embedId)?.remove();
            document.querySelectorAll('script[src*="infogram.com"]').forEach(el => el.remove());
            this.iframeObject = {
              embedId: '',
              title: '',
              embedSrc: '',
            };
          })
        },
        onClickIndicador(item) {
          this.iframeURL = item.Enlace;


          const iframeObject = {
            embedId: item.Embed_id,
            title: item.title,
            embedSrc: item.Embed_src,
          };
          const modalBody = document.getElementById('modal-body');
          modalBody.innerHTML = '';

          // If the item provides an embed script (e.g., Infogram), inject it
          if (iframeObject.embedSrc) {
            // remove any previous embed with same id
            const script = document.createElement('script');
            script.type = 'text/javascript';
            if (iframeObject.embedId) script.id = iframeObject.embedId;
            if (iframeObject.title) script.title = iframeObject.title;
            script.src = iframeObject.embedSrc;
            modalBody.appendChild(script);
          } 
          console.log('iframeObject:', iframeObject);
          this.iframeObject = iframeObject;
          const modal = new bootstrap.Modal('#myModal');
          modal.show();
        },
        search(query) {
          if (!query) {
            return this.items;
          }
          console.log('Searching for:', query);
          console.log(this.minisearch);
          return this.minisearch.search(query, { prefix: true });
        },
        get filteredItems() {
          const results = this.search(this.query);
          console.log(results);
          return results;
        },
        get totalPages() {
          return Math.ceil(this.filteredItems.length / this.page.pageSize);
        },

      }));
    });