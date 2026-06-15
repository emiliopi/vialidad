import sys
from pathlib import Path
from datetime import datetime

# Agregar la ruta del backend al path para poder importar 'app'
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.append(str(BACKEND_DIR))

try:
    from app.services.pdf_generator import generar_pdf_vialidad
except ImportError as e:
    print(f"Error al importar generar_pdf_vialidad: {e}")
    print("Asegúrate de ejecutar este script desde la carpeta backend.")
    sys.exit(1)

class MockVialidad:
    def __init__(self):
        self.codigo_vialidad = 1
        self.llave_unica = "TEST-LLAVE-UNICA-12345"
        self.numero_recibo = "0000456"
        self.nombre = "JUAN ANTONIO PÉREZ GÓMEZ"
        self.distrito = "SAN SALVADOR CENTRO"
        self.concepto = "EMPLEADO"
        self.fecha_emision = datetime.now()
        self.fecha_expiracion = datetime.now()
        self.con_marca_agua = True
        self.precio_vialidad = 3.43
        self.firma_alcalde_url = "/firma_alcalde.png"
        self.firma_secretario_url = "/firma_secretario.png"

def test_generation():
    print("Creando objeto de prueba MockVialidad...")
    vialidad = MockVialidad()
    
    # Generamos una URL de verificación local de prueba
    url_verificador = "http://localhost:3000"
    
    try:
        print("Generando PDF usando headless browser...")
        pdf_stream = generar_pdf_vialidad(vialidad, url_verificador=url_verificador)
        
        # Guardar el PDF resultante en la raíz del backend
        pdf_output_path = BACKEND_DIR / "test_output.pdf"
        with open(pdf_output_path, "wb") as f:
            f.write(pdf_stream.getvalue())
            
        print(f"\n[Exito] Archivo PDF generado en:")
        print(f"-> {pdf_output_path.resolve()}")
        print("\nPuedes abrir este PDF directamente para verificar el diseño.")
        
    except Exception as e:
        print(f"\n[Error] al generar el PDF: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generation()
