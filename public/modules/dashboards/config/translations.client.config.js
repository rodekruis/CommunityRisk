'use strict';

// Providing translations

var angular_vars = {
	
	//Dynamic (Angular) variables
	metric_label: '{{metric_label | translate}}',
	metric_desc: '{{metric_desc | translate}}',	

};

var static_en = {
		  
	//Static HTML
	COMMUNITY_RISK: 'Community Risk',
	IMPACT_DATABASE: 'Impact database',
	PRIORITY_INDEX: 'Priority Index',
	HOW_IT_WORKS: 'How it works',
	EXPORT: 'Export',
	share_url: 'Share current settings (URL)',
	export_csv: 'Export (CSV)',
	export_geojson: 'Export (GEOJSON)',
	COUNTRY: 'Country',
	Map: 'Map',
	Tab: 'Tab',
	selected: ' selected',
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

};

var static_es = {
	//Static HTML
	COMMUNITY_RISK: 'RIESGO COMUNITARIO',	
	IMPACT_DATABASE: 'BASE DE DATOS DE IMPACTO',
	PRIORITY_INDEX: 'Índice de prioridad',
	HOW_IT_WORKS: 'Cómo funciona',
	EXPORT: 'Exportar',
	share_url: 'Compartir la configuración actual (URL)',
	export_csv: 'Exportar (CSV)',
	export_geojson: 'Exportar (GEOJSON)',
	COUNTRY: 'País',
	Map: 'Mapa',
	Tab: 'Tabular',
	selected: ' seleccionado',
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
	ie_warning: 'This beta-version is currently best viewed in Google Chrome, and second-best in Firefox or Safari. Internet Explorer works, but has substantial interaction downsides.',
	go_to_dashboard: 'Ir al panel de país',
	cra_intro1: 'Community Risk Assessment - ',
	cra_intro2: ' comunidades en ',
	cra_intro3: ' países incluídos',
	cra_description: 'Relieving the suffering of individuals affected by disasters is at the heart of humanitarian action. However, given limited funding, humanitarian actors cannot reach all people in need. They have to identify the geographic areas that are most affected by a humanitarian disaster or crisis and, within those areas, the individuals that are most in need. Currently, this prioritization process takes time and can be subjective. The Community Risk Assessment dashboard forms a data-driven alternative solution.',

};

var labels_es = {	
	//Input for dynamic variables
	risk_score: 'Índice de riesgo',
	hazard_score: 'Índice de peligros',
};

var descriptions_es = {	
	//Input for dynamic variables
	desc_risk_score: 'Índice de riesgo blablabla',
	desc_hazard_score: 'Índice de peligros blablabla',
};

angular.module('dashboards').config(function ($translateProvider) {
	
	d3.dsv(';')('modules/dashboards/data/metadata_prototype.csv', function(metadata) {
	
		var labels_en = {};
		var descriptions_en = {};
		for (var i=0;i<metadata.length;i++){
			labels_en[metadata[i].variable] = metadata[i].label;
			descriptions_en['desc_' + metadata[i].variable] = metadata[i].description;
		}
		
		$translateProvider.translations('en', Object.assign({},angular_vars,static_en,labels_en,descriptions_en));
		$translateProvider.translations('es', Object.assign({},angular_vars,static_es,labels_es,descriptions_es));
	});
	
	$translateProvider.preferredLanguage('en');
	$translateProvider.fallbackLanguage('en');
	
});