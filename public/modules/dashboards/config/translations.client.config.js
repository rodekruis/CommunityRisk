'use strict';

// Providing translations

var angular_vars = {
	
	//Dynamic (Angular) variables
	metric_label: '{{metric_label | translate}}',
	metric_label_popup: '{{metric_label_popup | translate}}',
	metric_desc: '{{metric_desc | translate}}',	
    levelB_selection_pre: '{{levelB_selection_pre | translate}}',
    levelC_selection_pre: '{{levelC_selection_pre | translate}}'

};

var static_en = {
		  
	//Static HTML
	COMMUNITY_RISK: 'Community Risk',
	IMPACT_DATABASE: 'Impact database',
	PRIORITY_INDEX: 'Priority Index',
	HOW_IT_WORKS: 'How it works',
	EXPORT: 'Export',
    share_country_url: 'Share current country (URL)',
	share_url: 'Share full current settings (URL)', 
	export_csv: 'Export (CSV)',
	export_geojson: 'Export (GEOJSON)',
    about_CRA: 'About CRA',
	COUNTRY: 'Country',
	Map: 'Map',
	Tab: 'Tab',
	selected: ' selected',
    hit: ' hit',
	Select_all: 'Select all',
	risk_score_tag: 'Overall composite risk score',
	hazard_score_tag: 'Click for hazard components',
	vulnerability_score_tag: 'Click for vulnerability components',
	coping_score_tag: 'Click for coping capacity components',
	other_variables: 'Other variables',
	other_variables_tag: 'Not part of risk framework, but still relevant.',
	sort_by: 'Sort by ...',
	indicator_score: 'Indicator Score',
	area_name: 'Area name',
	scroll_top: 'Scroll to Top',
	year_source: 'Year source',
	link_source: 'Source link',
	desc_source: 'Description',
	share_url_title: 'Share current settings directly through URL',
	share_url_copy: 'Copy URL',
	warning: 'Warning',
	ie_warning: 'This beta-version is currently best viewed in Google Chrome, and second-best in Firefox or Safari. Internet Explorer works, but has substantial interaction downsides.',
	go_to_dashboard: 'Go to country dashboard',
	cra_intro1: 'Community Risk Assessment - ',
	cra_intro2: ' communities in ',
	cra_intro3: ' countries included',
	cra_description: 'Relieving the suffering of individuals affected by disasters is at the heart of humanitarian action. However, given limited funding, humanitarian actors cannot reach all people in need. They have to identify the geographic areas that are most affected by a humanitarian disaster or crisis and, within those areas, the individuals that are most in need. Currently, this prioritization process takes time and can be subjective. The Community Risk Assessment dashboard forms a data-driven alternative solution.',
    language: 'Language',
    about: 'About',
    all_yes: 'All ',
    all_no: '',
    data_preparedness_index: 'Data Preparedness Index',
    dpi_tag: 'Completeness, recency and quality of sources',
};

var static_es = {
	//Static HTML
	COMMUNITY_RISK: 'RIESGO COMUNITARIO',	
	IMPACT_DATABASE: 'BASE DE DATOS DE IMPACTO',
	PRIORITY_INDEX: 'Índice de prioridad',
	HOW_IT_WORKS: 'Cómo funciona',
	EXPORT: 'Exportar',
    share_country_url: 'Compartir el país actual (URL)',
	share_url: 'Compartir la configuración actual (URL)',
	export_csv: 'Exportar (CSV)',
	export_geojson: 'Exportar (GEOJSON)',
    about_CRA: 'Sobre CRA',
	COUNTRY: 'País',
	Map: 'Mapa',
	Tab: 'Tabular',
	selected: ' seleccionado',
    hit: ' afectado',
	Select_all: 'Seleccionar todo',
	risk_score_tag: 'Índice de riesgo global compuesto',
	hazard_score_tag: 'Haga clic para los componentes peligrosos',
	vulnerability_score_tag: 'Haga clic para ver los componentes de vulnerabilidad',
	coping_score_tag: 'Haga clic para conocer los componentes de la capacidad de afrontamiento',
	other_variables: 'Otras variables',
	other_variables_tag: 'No forma parte del marco de riesgo, pero sigue siendo relevante.',
	sort_by: 'Ordenar por ...',
	indicator_score: 'Puntaje Indicador',
	area_name: 'Nombre del área',
	scroll_top: 'Vuelve al comienzo',
	year_source: 'Año de origen',
	link_source: 'Enlace de origen',
	desc_source: 'Descripción',
	share_url_title: 'Comparte la configuración actual directamente a través de la URL',
	share_url_copy: 'Copiar URL',
	warning: 'Advertencia',
	ie_warning: 'Actualmente, esta versión beta se visualiza mejor en el navegador Google Chrome, seguido de Firefox o Safari. Internet Explorer funciona, pero tiene desventajas sustanciales de interacción.',
	go_to_dashboard: 'Ir al panel de país',
	cra_intro1: 'Community Risk Assessment - ', //'Evaluación de riesgo de la comunidad - ' 
	cra_intro2: ' comunidades en ',
	cra_intro3: ' países incluídos',
	cra_description: 'El propósito de la acción humanitaria es aliviar el sufrimiento de las personas afectadas por desastres. Sin embargo, los actores humanitarios no siempre pueden llegar a todas las personas necesitadas debido a los fondos limitados. Es por esto que se deben identificar las áreas geográficas más afectadas por crisis o desastres humanitarios y, dentro de esas áreas, las personas que están más necesitadas. Actualmente, este proceso de priorización requiere tiempo y puede ser subjetivo. La plataforma de Evaluación de riesgos de la comunidad propone una solución alternativa basada en datos.',
    language: 'Idioma',
    all_yes: 'Todos ',
    all_no: '',
    data_preparedness_index: 'Índice de preparación de datos',
    dpi_tag: 'Integridad, actualidad y calidad de las fuentes',
    
};

var static_fr = {
		  
	//Static HTML
	COMMUNITY_RISK: 'Risques Communautaires',
	IMPACT_DATABASE: 'Base de Données d\'Impact',
	PRIORITY_INDEX: 'Indice de priorité',
	HOW_IT_WORKS: 'Comment ça marche',
	EXPORT: 'Exporter',
	share_url: 'Partager la configuration actuelle (URL)',
	export_csv: 'Exporter (CSV)',
	export_geojson: 'Exporter (GEOJSON)',
	COUNTRY: 'Pays',
	Map: 'Carte',
	Tab: 'Onglet',
	selected: ' sélectionné',
	hit: ' ',
	Select_all: 'Tout sélectionner',
	risk_score_tag: 'Indice global de risque',
	hazard_score_tag: 'Cliquez pour voir les composantes d\'alea',
	vulnerability_score_tag: 'Cliquez pour voir les composantes de vulnérabilité',
	coping_score_tag: 'Cliquez pour voir les composantes de capacité d\'adaptation',
	other_variables: 'Autres indicateurs',
	other_variables_tag: 'En dehors de l\'équation du risque, mais toujours pertinent.',
	sort_by: 'Trier par ...',
	indicator_score: 'Résultat de l\'indicateur',
	area_name: 'Nom de la région',
	scroll_top: 'Retour en haut',
	year_source: 'Année de la référence',
	link_source: 'Lien vers la référence',
	desc_source: 'Description',
	share_url_title: 'Partager la configuration actuelle avec un lien',
	share_url_copy: 'Copier le lien',
	warning: 'Avertissement',
	ie_warning: 'Cette version beta est mieux accessible avec Google Chrome et ensuite avec Firefox ou Safari. Internet Explorer fonctionne aussi, mais l\'accès n\'est pas optimal.',
	go_to_dashboard: 'Vers le tableau de bord',
	cra_intro1: ' Evaluation des Risques Communautaires - ',
	cra_intro2: ' communautés dans ',
	cra_intro3: ' pays',
	cra_description: 'Le but de l\'action humanitaire est de soulager la souffrance des individus touchés par des catastrophes. Cependant, le financement est limité et l\'action humanitaire ne pourra pas accéder à toutes les personnes ayant besoin d\'aide. Il faut identifier les zones géographiques les plus vulnérables aux catastrophes et crises humanitaires, avant d\'identifier les personnes qui ont le plus besoin d\'aide. En ce moment, ce procès d\'identification prend beaucoup de temps et peut-être subjectif. Le tableau de bord de l\'Evaluation des Risques Communautaires propose une solution basée sur des données.',
	language: 'Langue',
	about_CRA: 'À propos de l\'ERC',
	share_country_url: 'Partager le pays actuel (URL)',
	all_yes: 'Tout ',
	all_no: '',
	data_preparedness_index: 'Statut des données disponibles',
	dpi_tag: 'Degré d\'actualité, qualité et exhaustivité des données',
	dpi_warning: 'À ce niveau d\'administration il n\'est pas possible d\'interpréter l\'indice d\'analyse de données du cadre de risque. Il faut plus de données, plus récentes ou de meilleure qualité. Les indicateurs qui sont inclus (par example population ou pauvreté) peuvent quand-même être utilisés seuls.',
	needs_data: 'Besoin de plus de données',
	dpi_inspect: 'Inspecter Indice d\'analyse de données',
	draft_warning: 'Le tableau de bord ne contient que peu d\'indicateurs qui ont besoin d\'un contrôle de qualité et d\'usage. Ces informations ne doivent pas encore être utilisées pour communication externe ou pour tirer des conclusions.',
	draft: 'Version temporaire',

};

//OPTION 1: get data from database (via Data-service)
// advantage: no double import of metadata needed (database + local file). With small change in metadata you only need to 'publish' database, and not database+code. 
// disadvantage: the database import is a bit slower, so upon initial loading you might see the text-tags instead of the labels shortly. 
// angular.module('dashboards').config(function ($translateProvider, DataProvider) {

// 	var standard_input = "1,'BEN','{}','CRA','undefined','undefined'";
// 	DataProvider.$get().get(
// 		{adminLevel: standard_input}, 
// 		function(pgData){

// 			var metadata = pgData.usp_data.meta_indicators;

// 			var labels_en = {};
// 			var descriptions_en = {};
// 			var labels_es = {};
// 			var descriptions_es = {};
// 			var labels_fr = {};
// 			var descriptions_fr = {};
// 			for (var i=0;i<metadata.length;i++){
// 				labels_en[metadata[i].variable] = metadata[i].label;
// 				descriptions_en['desc_' + metadata[i].variable] = metadata[i].description;
// 				if (metadata[i].label_espanol) {
// 					labels_es[metadata[i].variable] = metadata[i].label_espanol;
// 					descriptions_es['desc_' + metadata[i].variable] = metadata[i].description_espanol;
// 				}
// 				if (metadata[i].label_french) {
// 					labels_fr[metadata[i].variable] = metadata[i].label_french;
// 					descriptions_fr['desc_' + metadata[i].variable] = metadata[i].description_french;
// 				}
// 			}

// 			$translateProvider.translations('en', $.extend({},angular_vars,static_en,labels_en,descriptions_en));
// 			$translateProvider.translations('es', $.extend({},angular_vars,static_es,labels_es,descriptions_es));
// 			$translateProvider.translations('fr', $.extend({},angular_vars,static_fr,labels_fr,descriptions_fr));

// 		}
// 	);
	
// 	$translateProvider.preferredLanguage('en');
// 	$translateProvider.fallbackLanguage('en');
	
// });

//OPTION 2: get data from local file-system
// disadvantage: double import of metadata needed (database + local file). So with small change you need to publish both database and code (via git).
// advantage: the local-file import is faster, so you immediately see the labels, and not the tags upon initial loading.

angular.module('dashboards').config(function ($translateProvider) {

	d3.dsv(';','text/plain; charset=ISO-8859-1')('modules/dashboards/data/metadata_prototype.csv', function(metadata) {
        	
		var labels_en = {};
		var descriptions_en = {};
		var labels_es = {};
		var descriptions_es = {};
		var labels_fr = {};
		var descriptions_fr = {};
		for (var i=0;i<metadata.length;i++){
			labels_en[metadata[i].variable] = metadata[i].label;
			descriptions_en['desc_' + metadata[i].variable] = metadata[i].description;
            if (metadata[i].label_espanol) {
                labels_es[metadata[i].variable] = metadata[i].label_espanol;
                descriptions_es['desc_' + metadata[i].variable] = metadata[i].description_espanol;
            }
            if (metadata[i].label_french) {
                labels_fr[metadata[i].variable] = metadata[i].label_french;
                descriptions_fr['desc_' + metadata[i].variable] = metadata[i].description_french;
            }
		}

		$translateProvider.translations('en', $.extend({},angular_vars,static_en,labels_en,descriptions_en));
		$translateProvider.translations('es', $.extend({},angular_vars,static_es,labels_es,descriptions_es));
		$translateProvider.translations('fr', $.extend({},angular_vars,static_fr,labels_fr,descriptions_fr));
		
	});	
	
	$translateProvider.preferredLanguage('en');
	$translateProvider.fallbackLanguage('en');
	
});