from pathlib import Path
import re

# FAQ data: slug -> {lang -> [(question, answer), ...]}
FAQ_DATA = {
    "how-to-clean-urls-for-sharing": {
        "en": [
            ("What are tracking parameters?", "Tracking parameters like UTM, fbclid, and gclid are added by marketing platforms to monitor where clicks come from. They can reveal your browsing habits and make links look messy when shared."),
            ("Why remove them?", "Removing tracking parameters protects your privacy by preventing platforms from tracking you across the web. It also makes links cleaner and more professional when shared."),
            ("How to clean a URL", "Simply paste your URL into our tool and click clean. The tool automatically removes all known tracking parameters while preserving the core link functionality."),
            ("Does it affect affiliate links?", "No — affiliate tracking codes embedded in the URL path are preserved. Only unnecessary tracking parameters are removed."),
        ],
        "de": [
            ("Was sind Tracking-Parameter?", "Tracking-Parameter wie UTM, fbclid und gclid werden von Marketing-Plattformen hinzugefügt, um zu überwachen, woher Klicks kommen. Sie können Ihre Surf-Gewohnheiten offenbaren und Links beim Teilen unordentlich aussehen lassen."),
            ("Warum entfernen?", "Das Entfernen von Tracking-Parametern schützt Ihre Privatsphäre, indem es Plattformen daran hindert, Sie im Web zu verfolgen. Es macht Links auch sauberer und professioneller."),
            ("So bereinigen Sie eine URL", "Fügen Sie einfach Ihre URL in unser Tool ein und klicken Sie auf bereinigen. Das Tool entfernt automatisch alle bekannten Tracking-Parameter und behält die Kern-Link-Funktionalität bei."),
            ("Betrifft das Affiliate-Links?", "Nein — Affiliate-Tracking-Codes, die in den URL-Pfad eingebettet sind, bleiben erhalten. Nur unnötige Tracking-Parameter werden entfernt."),
        ],
        "es": [
            ("¿Qué son los parámetros de seguimiento?", "Los parámetros de seguimiento como UTM, fbclid y gclid son añadidos por plataformas de marketing para monitorear de dónde vienen los clics. Pueden revelar sus hábitos de navegación y hacer que los enlaces se vean desordenados al compartirlos."),
            ("¿Por qué eliminarlos?", "Eliminar los parámetros de seguimiento protege su privacidad al evitar que las plataformas lo rastreen en la web. También hace que los enlaces sean más limpios y profesionales."),
            ("Cómo limpiar una URL", "Simplemente pegue su URL en nuestra herramienta y haga clic en limpiar. La herramienta elimina automáticamente todos los parámetros de seguimiento conocidos mientras preserva la funcionalidad del enlace principal."),
            ("¿Afecta a los enlaces de afiliados?", "No — los códigos de seguimiento de afiliados incrustados en la ruta de la URL se conservan. Solo se eliminan los parámetros de seguimiento innecesarios."),
        ],
        "fr": [
            ("Que sont les paramètres de traçage ?", "Les paramètres de traçage comme UTM, fbclid et gclid sont ajoutés par les plateformes marketing pour surveiller d'où viennent les clics. Ils peuvent révéler vos habitudes de navigation et rendre les liens désordonnés lors du partage."),
            ("Pourquoi les retirer ?", "Supprimer les paramètres de traçage protège votre vie privée en empêchant les plateformes de vous suivre sur le web. Cela rend aussi les liens plus propres et professionnels."),
            ("Comment nettoyer une URL", "Collez simplement votre URL dans notre outil et cliquez sur nettoyer. L'outil supprime automatiquement tous les paramètres de traçage connus tout en préservant la fonctionnalité du lien principal."),
            ("Cela affecte-t-il les liens d'affiliation ?", "Non — les codes de suivi d'affiliation intégrés dans le chemin de l'URL sont conservés. Seuls les paramètres de traçage inutiles sont supprimés."),
        ],
        "hi": [
            ("ट्रैकिंग पैरामीटर क्या हैं?", "UTM, fbclid और gclid जैसे ट्रैकिंग पैरामीटर मार्केटिंग प्लेटफॉर्म द्वारा जोड़े जाते हैं ताकि यह ट्रैक किया जा सके कि क्लिक कहाँ से आ रहे हैं। वे आपकी ब्राउज़िंग आदतों को प्रकट कर सकते हैं और साझा करते समय लिंक को गन्दा दिखा सकते हैं।"),
            ("उन्हें क्यों हटाया जाए?", "ट्रैकिंग पैरामीटर हटाने से आपकी गोपनीयता सुरक्षित होती है क्योंकि यह प्लेटफॉर्म को वेब पर आपका पीछा करने से रोकता है। यह लिंक को भी साफ़ और अधिक पेशेवर बनाता है।"),
            ("यूआरएल को कैसे साफ़ करें", "बस अपनी यूआरएल को हमारे टूल में पेस्ट करें और साफ़ करें पर क्लिक करें। टूल स्वचालित रूप से सभी ज्ञात ट्रैकिंग पैरामीटर हटा देता है जबकि मुख्य लिंक कार्यक्षमता बनाए रखता है।"),
            ("क्या यह सहबद्ध लिंक को प्रभावित करता है?", "नहीं — यूआरएल पथ में एम्बेडेड सहबद्ध ट्रैकिंग कोड संरक्षित हैं। केवल अनावश्यक ट्रैकिंग पैरामीटर हटा दिए जाते हैं।"),
        ],
        "ja": [
            ("追跡パラメータとは何ですか？", "UTM、fbclid、gclidなどの追跡パラメータは、マーケティングプラットフォームによって追加され、クリックがどこから来たかを監視します。閲覧習慣を明らかにし、共有時にリンクを乱雑に見せることがあります。"),
            ("なぜ削除するのですか？", "追跡パラメータを削除すると、プラットフォームがウェブ上であなたを追跡するのを防ぎ、プライバシーを保護します。また、リンクをよりクリーンでプロフェッショナルにします。"),
            ("URLをクリーンアップする方法", "URLをツールに貼り付けて、クリーンアップをクリックするだけです。ツールは既知の追跡パラメータをすべて自動的に削除し、コアリンク機能を保持します。"),
            ("アフィリエイトリンクに影響しますか？", "いいえ — URLパスに埋め込まれたアフィリエイト追跡コードは保持されます。不要な追跡パラメータのみが削除されます。"),
        ],
        "pt": [
            ("O que são parâmetros de rastreamento?", "Parâmetros de rastreamento como UTM, fbclid e gclid são adicionados por plataformas de marketing para monitorar de onde vêm os cliques. Eles podem revelar seus hábitos de navegação e deixar os links desorganizados ao compartilhar."),
            ("Por que removê-los?", "Remover parâmetros de rastreamento protege sua privacidade ao impedir que plataformas o rastreiem pela web. Também deixa os links mais limpos e profissionais."),
            ("Como limpar uma URL", "Simplesmente cole sua URL em nossa ferramenta e clique em limpar. A ferramenta remove automaticamente todos os parâmetros de rastreamento conhecidos enquanto preserva a funcionalidade principal do link."),
            ("Isso afeta links de afiliados?", "Não — os códigos de rastreamento de afiliados incorporados no caminho da URL são preservados. Apenas parâmetros de rastreamento desnecessários são removidos."),
        ],
        "ru": [
            ("Что такое параметры отслеживания?", "Параметры отслеживания, такие как UTM, fbclid и gclid, добавляются маркетинговыми платформами для отслеживания источников кликов. Они могут раскрыть ваши привычки просмотра и сделать ссылки неаккуратными при совместном использовании."),
            ("Зачем их удалять?", "Удаление параметров отслеживания защищает вашу конфиденциальность, не позволяя платформам отслеживать вас в интернете. Это также делает ссылки более чистыми и профессиональными."),
            ("Как очистить URL", "Просто вставьте свой URL в наш инструмент и нажмите очистить. Инструмент автоматически удаляет все известные параметры отслеживания, сохраняя основную функциональность ссылки."),
            ("Влияет ли это на партнерские ссылки?", "Нет — партнерские коды отслеживания, встроенные в путь URL, сохраняются. Удаляются только ненужные параметры отслеживания."),
        ],
    },
    "how-to-compress-images-email": {
        "en": [
            ("Choose the right format", "JPG is best for photographs, PNG for images with transparency, and WebP offers the best compression with quality. Our converter handles all three formats."),
            ("Find the quality sweet spot", "Aim for 80-85% quality — this reduces file size significantly while keeping visuals crisp. Our tool lets you preview before downloading."),
            ("Resize if needed", "For email, resize images to max 1200px wide. Most screens can't display larger images anyway, and smaller files load faster."),
            ("Strip metadata first", "Remove EXIF metadata before compressing. This hidden data can add 10-30% to file size without improving the image."),
        ],
        "de": [
            ("Das richtige Format wählen", "JPG ist am besten für Fotos, PNG für Bilder mit Transparenz und WebP bietet die beste Kompression bei Qualität. Unser Konverter unterstützt alle drei Formate."),
            ("Den Qualitätssweetspot finden", "Zielen Sie auf 80-85% Qualität ab — dies reduziert die Dateigröße erheblich und hält die Bilder scharf. Unser Tool ermöglicht eine Vorschau vor dem Download."),
            ("Bei Bedarf verkleinern", "Für E-Mails Bilder auf maximal 1200px Breite verkleinern. Die meisten Bildschirme können sowieso keine größeren Bilder anzeigen, und kleinere Dateien laden schneller."),
            ("Zuerst Metadaten entfernen", "Entfernen Sie EXIF-Metadaten vor der Kompression. Diese versteckten Daten können 10-30% zur Dateigröße hinzufügen, ohne das Bild zu verbessern."),
        ],
        "es": [
            ("Elegir el formato correcto", "JPG es mejor para fotografías, PNG para imágenes con transparencia y WebP ofrece la mejor compresión con calidad. Nuestro convertidor maneja los tres formatos."),
            ("Encontrar el punto óptimo de calidad", "Apunte al 80-85% de calidad — esto reduce significativamente el tamaño del archivo manteniendo las imágenes nítidas. Nuestra herramienta permite una vista previa antes de descargar."),
            ("Redimensionar si es necesario", "Para email, redimensione imágenes a un máximo de 1200px de ancho. La mayoría de las pantallas no pueden mostrar imágenes más grandes de todos modos, y los archivos más pequeños cargan más rápido."),
            ("Eliminar metadatos primero", "Elimine los metadatos EXIF antes de comprimir. Estos datos ocultos pueden agregar un 10-30% al tamaño del archivo sin mejorar la imagen."),
        ],
        "fr": [
            ("Choisir le bon format", "JPG est le meilleur pour les photographies, PNG pour les images avec transparence, et WebP offre la meilleure compression avec qualité. Notre convertisseur gère les trois formats."),
            ("Trouver le bon équilibre de qualité", "Visez 80-85% de qualité — cela réduit considérablement la taille du fichier tout en gardant les images nettes. Notre outil permet un aperçu avant le téléchargement."),
            ("Redimensionner si nécessaire", "Pour l'email, redimensionnez les images à 1200px de large maximum. La plupart des écrans ne peuvent de toute façon pas afficher des images plus grandes, et les fichiers plus petits se chargent plus vite."),
            ("Supprimer d'abord les métadonnées", "Supprimez les métadonnées EXIF avant de compresser. Ces données cachées peuvent ajouter 10-30% à la taille du fichier sans améliorer l'image."),
        ],
        "hi": [
            ("सही प्रारूप चुनें", "फोटोग्राफ के लिए JPG सबसे अच्छा है, पारदर्शिता वाली छवियों के लिए PNG, और WebP गुणवत्ता के साथ सबसे अच्छा संपीड़न प्रदान करता है। हमारा कनवर्टर तीनों प्रारूपों को संभालता है।"),
            ("गुणवत्तापूर्ण मधुर स्थान खोजें", "80-85% गुणवत्ता का लक्ष्य रखें — यह फ़ाइल आकार को काफी कम करता है जबकि दृश्यों को तेज रखता है। हमारा टूल डाउनलोड करने से पहले पूर्वावलोकन करने देता है।"),
            ("यदि आवश्यक हो तो आकार बदलें", "ईमेल के लिए, छवियों को अधिकतम 1200px चौड़ाई तक आकार बदलें। अधिकांश स्क्रीन वैसे भी बड़ी छवियां प्रदर्शित नहीं कर सकती हैं, और छोटी फाइलें तेजी से लोड होती हैं।"),
            ("पहले मेटाडेटा स्ट्रिप करें", "संपीड़ित करने से पहले EXIF मेटाडेटा हटाएं। यह छिपा हुआ डेटा छवि में सुधार किए बिना फ़ाइल आकार में 10-30% जोड़ सकता है।"),
        ],
        "ja": [
            ("適切な形式を選ぶ", "写真にはJPG、透明性のある画像にはPNG、そしてWebPは品質を保ちながら最高の圧縮を提供します。私たちのコンバーターは3つの形式すべてを処理できます。"),
            ("品質の最適点を見つける", "80-85%の品質を目指してください — これによりファイルサイズを大幅に削減しながら、画像を鮮明に保ちます。私たちのツールでは、ダウンロード前にプレビューが可能です。"),
            ("必要に応じてリサイズ", "メール用には、画像を最大1200px幅にリサイズしてください。ほとんどの画面ではそれ以上の画像を表示できないため、小さいファイルの方が読み込みが速くなります。"),
            ("まずメタデータを削除", "圧縮する前にEXIFメタデータを削除してください。この隠れたデータは画像を改善することなく、ファイルサイズに10-30%追加する可能性があります。"),
        ],
        "pt": [
            ("Escolher o formato certo", "JPG é melhor para fotografias, PNG para imagens com transparência e WebP oferece a melhor compressão com qualidade. Nosso conversor lida com os três formatos."),
            ("Encontrar o ponto ideal de qualidade", "Mire em 80-85% de qualidade — isso reduz significativamente o tamanho do arquivo mantendo as imagens nítidas. Nossa ferramenta permite visualizar antes de baixar."),
            ("Redimensionar se necessário", "Para email, redimensione imagens para no máximo 1200px de largura. A maioria das telas não consegue exibir imagens maiores de qualquer forma, e arquivos menores carregam mais rápido."),
            ("Remover metadados primeiro", "Remova os metadados EXIF antes de comprimir. Esses dados ocultos podem adicionar 10-30% ao tamanho do arquivo sem melhorar a imagem."),
        ],
        "ru": [
            ("Выберите правильный формат", "JPG лучше всего подходит для фотографий, PNG — для изображений с прозрачностью, а WebP обеспечивает лучшее сжатие с сохранением качества. Наш конвертер поддерживает все три формата."),
            ("Найдите золотую середину качества", "Стремитесь к качеству 80-85% — это значительно уменьшает размер файла, сохраняя четкость изображений. Наш инструмент позволяет просмотреть результат перед загрузкой."),
            ("Измените размер, если необходимо", "Для email измените размер изображений до максимальной ширины 1200px. Большинство экранов все равно не могут отображать более крупные изображения, а меньшие файлы загружаются быстрее."),
            ("Сначала удалите метаданные", "Удалите метаданные EXIF перед сжатием. Эти скрытые данные могут добавить 10-30% к размеру файла, не улучшая изображение."),
        ],
    },
    "how-to-remove-metadata-before-sharing": {
        "en": [
            ("1. Photos: Remove EXIF & GPS data", "Photos contain EXIF metadata with GPS coordinates, camera model, and timestamps. Our EXIF Remover strips all this data while preserving image quality."),
            ("2. PDFs: Clear author and software info", "PDFs store author name, company, and software used to create them. Our PDF Metadata Remover deletes this hidden information completely."),
            ("3. Office documents: Strip edit history", "Word, Excel and PowerPoint files contain author names, company info, and edit history. Our Office Metadata Remover cleans all traces."),
            ("4. Videos: Remove GPS and device data", "Videos can contain GPS coordinates and device information. Our Video Metadata Remover strips all tracking data from MP4 and MOV files."),
            ("Why this matters", "Sharing files with metadata exposes personal information like your location, identity, and habits. Removing it protects your privacy before sharing."),
        ],
        "de": [
            ("1. Fotos: EXIF- und GPS-Daten entfernen", "Fotos enthalten EXIF-Metadaten mit GPS-Koordinaten, Kameramodell und Zeitstempeln. Unser EXIF-Entferner entfernt alle diese Daten und bewahrt die Bildqualität."),
            ("2. PDFs: Autor- und Software-Info löschen", "PDFs speichern Autorennamen, Unternehmen und verwendete Software. Unser PDF-Metadaten-Entferner löscht diese versteckten Informationen vollständig."),
            ("3. Office-Dokumente: Bearbeitungsverlauf entfernen", "Word-, Excel- und PowerPoint-Dateien enthalten Autorennamen, Unternehmensinfo und Bearbeitungsverlauf. Unser Office-Metadaten-Entferner bereinigt alle Spuren."),
            ("4. Videos: GPS- und Gerätedaten entfernen", "Videos können GPS-Koordinaten und Geräteinformationen enthalten. Unser Video-Metadaten-Entferner entfernt alle Tracking-Daten aus MP4- und MOV-Dateien."),
            ("Warum das wichtig ist", "Das Teilen von Dateien mit Metadaten legt persönliche Informationen wie Ihren Standort, Ihre Identität und Gewohnheiten offen. Das Entfernen schützt Ihre Privatsphäre vor dem Teilen."),
        ],
        "es": [
            ("1. Fotos: eliminar datos EXIF y GPS", "Las fotos contienen metadatos EXIF con coordenadas GPS, modelo de cámara y marcas de tiempo. Nuestro Eliminador EXIF elimina todos estos datos preservando la calidad de la imagen."),
            ("2. PDFs: borrar información de autor y software", "Los PDFs almacenan nombre del autor, empresa y software utilizado para crearlos. Nuestro Eliminador de Metadatos PDF borra esta información oculta completamente."),
            ("3. Documentos Office: eliminar historial de edición", "Los archivos Word, Excel y PowerPoint contienen nombres de autor, información de empresa e historial de edición. Nuestro Eliminador de Metadatos Office limpia todos los rastros."),
            ("4. Videos: eliminar datos GPS y del dispositivo", "Los videos pueden contener coordenadas GPS e información del dispositivo. Nuestro Eliminador de Metadatos de Video elimina todos los datos de seguimiento de archivos MP4 y MOV."),
            ("Por qué importa", "Compartir archivos con metadatos expone información personal como su ubicación, identidad y hábitos. Eliminarlos protege su privacidad antes de compartir."),
        ],
        "fr": [
            ("1. Photos : supprimer les données EXIF et GPS", "Les photos contiennent des métadonnées EXIF avec coordonnées GPS, modèle d'appareil et horodatages. Notre Suppresseur EXIF élimine toutes ces données tout en préservant la qualité de l'image."),
            ("2. PDFs : effacer les infos auteur et logiciel", "Les PDFs stockent le nom de l'auteur, l'entreprise et le logiciel utilisé pour les créer. Notre Suppresseur de Métadonnées PDF supprime complètement ces informations cachées."),
            ("3. Documents Office : supprimer l'historique de modifications", "Les fichiers Word, Excel et PowerPoint contiennent des noms d'auteur, infos d'entreprise et historique de modifications. Notre Suppresseur de Métadonnées Office nettoie toutes les traces."),
            ("4. Vidéos : supprimer les données GPS et de l'appareil", "Les vidéos peuvent contenir des coordonnées GPS et des informations sur l'appareil. Notre Suppresseur de Métadonnées Vidéo élimine toutes les données de suivi des fichiers MP4 et MOV."),
            ("Pourquoi c'est important", "Partager des fichiers avec des métadonnées expose des informations personnelles comme votre localisation, identité et habitudes. Les supprimer protège votre vie privée avant le partage."),
        ],
        "hi": [
            ("1. तस्वीरें: EXIF और GPS डेटा हटाएं", "तस्वीरों में GPS निर्देशांक, कैमरा मॉडल और टाइमस्टैम्प के साथ EXIF मेटाडेटा होता है। हमारा EXIF रिमूवर यह सारा डेटा हटाता है जबकि छवि गुणवत्ता बनाए रखता है।"),
            ("2. पीडीएफ: लेखक और सॉफ्टवेयर की जानकारी साफ़ करें", "पीडीएफ लेखक का नाम, कंपनी और उपयोग किए गए सॉफ्टवेयर को संग्रहीत करते हैं। हमारा PDF मेटाडेटा रिमूवर यह छिपी हुई जानकारी पूरी तरह से हटा देता है।"),
            ("3. कार्यालय दस्तावेज़: संपादन इतिहास हटाएं", "Word, Excel और PowerPoint फ़ाइलों में लेखक के नाम, कंपनी की जानकारी और संपादन इतिहास होता है। हमारा Office मेटाडेटा रिमूवर सभी निशान साफ़ कर देता है।"),
            ("4. वीडियो: जीपीएस और डिवाइस डेटा हटाएं", "वीडियो में GPS निर्देशांक और डिवाइस जानकारी हो सकती है। हमारा वीडियो मेटाडेटा रिमूवर MP4 और MOV फ़ाइलों से सभी ट्रैकिंग डेटा हटा देता है।"),
            ("यह क्यों मायने रखता है?", "मेटाडेटा के साथ फ़ाइलें साझा करने से आपका स्थान, पहचान और आदतें जैसी व्यक्तिगत जानकारी उजागर होती है। इसे हटाने से साझा करने से पहले आपकी गोपनीयता सुरक्षित होती है।"),
        ],
        "ja": [
            ("1. 写真：EXIF・GPSデータの削除", "写真にはGPS座標、カメラモデル、タイムスタンプを含むEXIFメタデータが含まれています。私たちのEXIFリムーバーは、画像品質を保持しながらすべてのデータを削除します。"),
            ("2. PDF：作成者とソフトウェア情報の消去", "PDFには作成者名、会社、使用したソフトウェアが保存されています。私たちのPDFメタデータリムーバーは、この隠れた情報を完全に削除します。"),
            ("3. Office文書：編集履歴の削除", "Word、Excel、PowerPointファイルには作成者名、会社情報、編集履歴が含まれています。私たちのOfficeメタデータリムーバーはすべての痕跡を消去します。"),
            ("4. 動画：GPSとデバイスデータの削除", "動画にはGPS座標とデバイス情報が含まれることがあります。私たちの動画メタデータリムーバーは、MP4およびMOVファイルからすべての追跡データを削除します。"),
            ("なぜ重要なのか", "メタデータを含むファイルを共有すると、位置、身元、習慣などの個人情報が露出します。削除することで、共有前にプライバシーを保護できます。"),
        ],
        "pt": [
            ("1. Fotos: remover dados EXIF e GPS", "Fotos contêm metadados EXIF com coordenadas GPS, modelo da câmera e timestamps. Nosso Removedor EXIF elimina todos esses dados preservando a qualidade da imagem."),
            ("2. PDFs: limpar informações de autor e software", "PDFs armazenam nome do autor, empresa e software usado para criá-los. Nosso Removedor de Metadados PDF exclui completamente essas informações ocultas."),
            ("3. Documentos Office: remover histórico de edição", "Arquivos Word, Excel e PowerPoint contêm nomes de autor, informações da empresa e histórico de edição. Nosso Removedor de Metadados Office limpa todos os rastros."),
            ("4. Vídeos: remover dados GPS e do dispositivo", "Vídeos podem conter coordenadas GPS e informações do dispositivo. Nosso Removedor de Metadados de Vídeo elimina todos os dados de rastreamento de arquivos MP4 e MOV."),
            ("Por que isso importa", "Compartilhar arquivos com metadados expõe informações pessoais como sua localização, identidade e hábitos. Removê-los protege sua privacidade antes de compartilhar."),
        ],
        "ru": [
            ("1. Фотографии: удалите данные EXIF и GPS.", "Фотографии содержат метаданные EXIF с координатами GPS, моделью камеры и временными метками. Наш EXIF Remover удаляет все эти данные, сохраняя качество изображения."),
            ("2. PDF-файлы: ясная информация об авторе и программном обеспечении.", "PDF-файлы хранят имя автора, компанию и программное обеспечение, использованное для их создания. Наш PDF Metadata Remover полностью удаляет эту скрытую информацию."),
            ("3. Офисные документы: удаление истории изменений.", "Файлы Word, Excel и PowerPoint содержат имена авторов, информацию о компании и историю изменений. Наш Office Metadata Remover очищает все следы."),
            ("4. Видео: удаление данных GPS и устройства.", "Видео может содержать координаты GPS и информацию об устройстве. Наш Video Metadata Remover удаляет все данные отслеживания из файлов MP4 и MOV."),
            ("Почему это важно", "Обмен файлами с метаданными раскрывает личную информацию, такую как ваше местоположение, личность и привычки. Удаление защищает вашу конфиденциальность перед обменом."),
        ],
    },
    "how-to-verify-downloaded-file-safe": {
        "en": [
            ("What is a checksum?", "A checksum is a unique fingerprint generated from a file's contents. If even one byte changes, the hash changes completely — making it perfect for verifying file integrity."),
            ("How to check SHA-256", "Paste the file and the expected hash into our tool. The tool calculates the SHA-256 hash of your file and compares it with the provided hash instantly."),
            ("Red flags to watch for", "If hashes don't match, the file may be corrupted or tampered with. Never run executables from untrusted sources without verification."),
            ("Why do this in the browser?", "Our tool runs entirely client-side — your files never leave your device. This is safer than uploading to online hash checkers that could store your data."),
        ],
        "de": [
            ("Was ist eine Prüfsumme?", "Eine Prüfsumme ist ein eindeutiger Fingerabdruck, der aus dem Inhalt einer Datei generiert wird. Wenn sich auch nur ein Byte ändert, ändert sich der Hash vollständig — ideal zur Überprüfung der Dateiintegrität."),
            ("So überprüfen Sie SHA-256", "Fügen Sie die Datei und den erwarteten Hash in unser Tool ein. Das Tool berechnet den SHA-256-Hash Ihrer Datei und vergleicht ihn sofort mit dem bereitgestellten Hash."),
            ("Warnsignale, auf die Sie achten sollten", "Wenn die Hashes nicht übereinstimmen, kann die Datei beschädigt oder manipuliert sein. Führen Sie niemals ausführbare Dateien aus nicht vertrauenswürdigen Quellen ohne Überprüfung aus."),
            ("Warum im Browser?", "Unser Tool läuft vollständig clientseitig — Ihre Dateien verlassen niemals Ihr Gerät. Das ist sicherer als das Hochladen zu Online-Hash-Checkern, die Ihre Daten speichern könnten."),
        ],
        "es": [
            ("¿Qué es una suma de comprobación?", "Una suma de comprobación es una huella digital única generada a partir del contenido de un archivo. Si cambia incluso un byte, el hash cambia por completo — lo que la hace perfecta para verificar la integridad del archivo."),
            ("Cómo verificar SHA-256", "Pegue el archivo y el hash esperado en nuestra herramienta. La herramienta calcula el hash SHA-256 de su archivo y lo compara instantáneamente con el hash proporcionado."),
            ("Señales de alerta a tener en cuenta", "Si los hashes no coinciden, el archivo puede estar corrupto o manipulado. Nunca ejecute ejecutables de fuentes no confiables sin verificación."),
            ("¿Por qué hacer esto en el navegador?", "Nuestra herramienta funciona completamente en el lado del cliente — sus archivos nunca abandonan su dispositivo. Esto es más seguro que subir a verificadores de hash en línea que podrían almacenar sus datos."),
        ],
        "fr": [
            ("Qu'est-ce qu'une somme de contrôle ?", "Une somme de contrôle est une empreinte digitale unique générée à partir du contenu d'un fichier. Si un seul octet change, le hash change complètement — ce qui le rend parfait pour vérifier l'intégrité du fichier."),
            ("Comment vérifier SHA-256", "Collez le fichier et le hash attendu dans notre outil. L'outil calcule le hash SHA-256 de votre fichier et le compare instantanément avec le hash fourni."),
            ("Signaux d'alerte à surveiller", "Si les hashes ne correspondent pas, le fichier peut être corrompu ou altéré. N'exécutez jamais d'exécutables de sources non fiables sans vérification."),
            ("Pourquoi faire cela dans le navigateur ?", "Notre outil fonctionne entièrement côté client — vos fichiers ne quittent jamais votre appareil. C'est plus sûr que de télécharger vers des vérificateurs de hash en ligne qui pourraient stocker vos données."),
        ],
        "hi": [
            ("चेकसम क्या है?", "चेकसम फ़ाइल की सामग्री से उत्पन्न एक अद्वितीय फ़िंगरप्रिंट है। यदि एक बाइट भी बदलता है, तो हैश पूरी तरह से बदल जाता है — जो इसे फ़ाइल अखंडता सत्यापित करने के लिए एकदम सही बनाता है।"),
            ("SHA-256 की जाँच कैसे करें", "फ़ाइल और अपेक्षित हैश को हमारे टूल में पेस्ट करें। टूल आपकी फ़ाइल का SHA-256 हैश तुरंत गणना करता है और इसकी तुलना प्रदान किए गए हैश से करता है।"),
            ("देखने लायक लाल झंडे", "यदि हैश मेल नहीं खाते हैं, तो फ़ाइल दूषित या छेड़छाड़ की गई हो सकती है। सत्यापन के बिना कभी भी अविश्वसनीय स्रोतों से एक्जीक्यूटेबल न चलाएं।"),
            ("ब्राउज़र में ऐसा क्यों करें?", "हमारा टूल पूरी तरह से क्लाइंट-साइड पर चलता है — आपकी फ़ाइलें कभी भी आपके डिवाइस को नहीं छोड़ती हैं। यह उन ऑनलाइन हैश चेकर पर अपलोड करने से सुरक्षित है जो आपका डेटा संग्रहीत कर सकते हैं।"),
        ],
        "ja": [
            ("チェックサムとは何ですか？", "チェックサムは、ファイルの内容から生成される一意の指紋です。1バイトでも変更されると、ハッシュは完全に変わります — これにより、ファイルの整合性を確認するのに最適です。"),
            ("SHA-256を確認する方法", "ファイルと期待されるハッシュをツールに貼り付けてください。ツールはファイルのSHA-256ハッシュを計算し、提供されたハッシュと即座に比較します。"),
            ("注意すべき警告サイン", "ハッシュが一致しない場合、ファイルが破損しているか改ざんされている可能性があります。検証なしに信頼できないソースからの実行ファイルを実行しないでください。"),
            ("なぜブラウザで行うのですか？", "私たちのツールは完全にクライアントサイドで実行されます — ファイルがデバイスから離れることはありません。これは、データを保存する可能性のあるオンラインハッシュチェッカーにアップロードするよりも安全です。"),
        ],
        "pt": [
            ("O que é uma soma de verificação?", "Uma soma de verificação é uma impressão digital única gerada a partir do conteúdo de um arquivo. Se mesmo um byte mudar, o hash muda completamente — tornando-o perfeito para verificar a integridade do arquivo."),
            ("Como verificar SHA-256", "Cole o arquivo e o hash esperado em nossa ferramenta. A ferramenta calcula o hash SHA-256 do seu arquivo e o compara instantaneamente com o hash fornecido."),
            ("Sinais de alerta para observar", "Se os hashes não corresponderem, o arquivo pode estar corrompido ou adulterado. Nunca execute executáveis de fontes não confiáveis sem verificação."),
            ("Por que fazer isso no navegador?", "Nossa ferramenta funciona totalmente no lado do cliente — seus arquivos nunca deixam seu dispositivo. Isso é mais seguro do que fazer upload para verificadores de hash online que poderiam armazenar seus dados."),
        ],
        "ru": [
            ("Что такое контрольная сумма?", "Контрольная сумма — это уникальный отпечаток, генерируемый из содержимого файла. Если изменится даже один байт, хеш полностью изменится — что делает его идеальным для проверки целостности файла."),
            ("Как проверить SHA-256", "Вставьте файл и ожидаемый хеш в наш инструмент. Инструмент вычисляет хеш SHA-256 вашего файла и мгновенно сравнивает его с предоставленным хешем."),
            ("Красные флаги, на которые стоит обратить внимание", "Если хеши не совпадают, файл может быть поврежден или подделан. Никогда не запускайте исполняемые файлы из ненадежных источников без проверки."),
            ("Зачем это делать в браузере?", "Наш инструмент работает полностью на стороне клиента — ваши файлы никогда не покидают ваше устройство. Это безопаснее, чем загружать на онлайн-проверки хешей, которые могут хранить ваши данные."),
        ],
    },
}

def build_faq_schema(questions, url):
    items = []
    for q, a in questions:
        items.append(f'''    {{
      "@type": "Question",
      "name": "{q}",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "{a}"
      }}
    }}''')
    
    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
{',\n'.join(items)}
  ]
}}
</script>'''

replaced = 0

for slug, langs in FAQ_DATA.items():
    for lang, questions in langs.items():
        if lang == "en":
            f = Path(f"guides/{slug}.html")
        else:
            f = Path(f"{lang}/guides/{slug}.html")
        
        if not f.exists():
            print(f"SKIP: {f}")
            continue
        
        html = f.read_text(encoding="utf-8", errors="ignore")
        
        if '"@type": "FAQPage"' in html:
            print(f"SKIP (déjà FAQ): {f}")
            continue
        
        url = f"https://presend.pages.dev/guides/{slug}"
        schema = build_faq_schema(questions, url)
        
        if "</body>" in html:
            new_html = html.replace("</body>", schema + "\n</body>")
            f.write_text(new_html, encoding="utf-8")
            replaced += 1
            print(f"AJOUTÉ: {f}")
        else:
            print(f"SKIP (pas de </body>): {f}")

print(f"\nTotal: {replaced} guides modifiés")
