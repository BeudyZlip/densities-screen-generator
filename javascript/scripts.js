$(document).ready(function() {

	if( window.location.hostname.indexOf("heroku") || window.location.hostname.indexOf("localhost") )
		$(".amazonAds").remove();

	$(document)
		.on('dragenter', '.dropzone', function() {
			return false;
		})
		.on('dragover', '.dropzone', function(e){
			e.preventDefault();
			e.stopPropagation();
			return false;
		})
		.on('dragleave', '.dropzone', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		})
		.on('drop', '.dropzone', function(e) {
			if(e.originalEvent.dataTransfer){
				if(e.originalEvent.dataTransfer.files.length) {
					e.preventDefault();
					e.stopPropagation();
					$("input[type='file']").prop("files", e.originalEvent.dataTransfer.files);
					$(".drop p span").text(e.originalEvent.dataTransfer.files[0].name)
				}
			}
			$(this).removeClass('hover');
			return false;
		})
		.on('click', '.dropzone', function(e) {
			$("input[type='file']").click();
		});

	$(".drop input[type='file']").on('change', function(e){
		$(".drop p span").text( e.originalEvent.target.files[0].name )
	})

	$('form').submit(function() {
		$('button').addClass('loading');
		$(this).ajaxSubmit({
			error: function(xhr) {
				status('Error: ' + xhr.status);
				$('button').removeClass('loading');
			},
			success: function(response) {
				$('button').removeClass('loading');
				if( response !== 'false' ) {
					response = JSON.parse(response);
					$(".result").show().append('<a href="' + response.zip + '"><i class="file archive outline icon"></i> ' + response.file + '</a>');
					setTimeout(function() {
						$(".result a:last").remove();
					}, 600000);

					location.replace(response.zip);
				}
			}
		});
		return false;
	});

	var reverse = function(s) {
			return s.split("").reverse().join("");
		},
		calcDenisty = function( val, density, direction, genre ) {
			$( '.' + genre + ' div.size').each(function(){
				var thisDensity = $(this).data('density'),
					checked = ( $('input[type=checkbox]' , this).prop('checked') == true ) ? true : false,
					thisVal = Math.round( ( val  * thisDensity ) / density );
				if( checked )
					$('input[type=number][data-direction=' + direction + ']',this).attr('placeholder',thisVal).val(thisVal);
				else
					$('input[type=number][data-direction=' + direction + ']',this).attr('placeholder',thisVal);
			})
		},
		input = {
			"ios": {
				'x1': 1,
				'x2': 2,
				'x3': 3
			},
			"android": {
				'ldpi': 0.75,
				'mdpi': 1,
				'hdpi' : 1.5,
				'xhdpi': 2,
				'xxhdpi': 3,
				'xxxhdpi': 4
			}
		}
		templateIOS = '<div class="size" data-size="{{size}}" data-density="{{density}}">'
						+ '<div class="ui checkbox"><input type="checkbox" name="ios[]" value="{{size}}"><label>@{{sizeR}}</label></div>'
						+ '<div class="ui right labeled input"><input class="{{size}}" data-direction="width" type="number" name="iosSize{{size}}[]" placeholder="" min="0" max="9999" maxlength="4" step="1" value="" /><div class="ui basic label">px</div></div>'
						+ '<div class="ui right labeled input"><input class="{{size}}" data-direction="height" type="number" name="iosSize{{size}}[]" placeholder="" min="0" max="9999" maxlength="4" step="1" value="" /><div class="ui basic label">px</div></div>'
					+ '</div>',

		templateAndroid = '<div class="size" data-size="{{size}}" data-density="{{density}}">'
							+ '<div class="ui checkbox"><input type="checkbox" name="android[]" value="{{size}}" /><label>{{size}}</label></div>'
							+ '<div class="ui right labeled input"><input class="{{size}}" data-direction="width" type="number" name="androidSize{{size}}[]" placeholder="" min="0" max="9999" maxlength="4" step="1" value="" /><div class="ui basic label">px</div></div>'
							+ '<div class="ui right labeled input"><input class="{{size}}" data-direction="height" type="number" name="androidSize{{size}}[]" placeholder="" min="0" max="9999" maxlength="4" step="1" value="" /><div class="ui basic label">px</div></div>'
						+ '</div>',
 		ios = '',
		android = '';

	$.each(input, function(k,e){
		if( k == 'ios') {
			$.each(e, function(d,i){
				var tpl = templateIOS;
				ios = ios + tpl.replace(/{{size}}/g,d)
							   .replace(/{{sizeR}}/g, reverse(d) )
							   .replace(/{{density}}/g, i );
			})
		}
		if( k == 'android') {
			$.each(e, function(d,i){
				var tpl = templateAndroid;
				android = android + tpl.replace(/{{size}}/g,d)
									   .replace(/{{density}}/g, i );
			})
		}
	});

	$('fieldset.ios').html(ios);
	$('fieldset.android').html(android);

	$('.ios input[type="checkbox"], .android input[type="checkbox"]').bind('change',function(e){
		var parent = $(this).parents('div.size');
		if( $(this).prop('checked') == false )
			$('input[type=number]', parent).each(function(){
				$(this).val('');
			})
		if( $(this).prop('checked') == true )
			$('input[type=number]', parent).each(function(){
				$(this).val( $(this).attr('placeholder') );
			})
	})

	$('.ios input[type="number"], .android input[type="number"]').bind('keyup change',function(){
		var parent = $(this).parents('div.size'),
			direction = $(this).data('direction'),
			density = $(parent).data('density'),
			genre = $(parent).parents('fieldset').attr('class');
		$('input[type=checkbox]',parent).prop('checked', true);
		if( ( $(this).val() == '' || $(this).val() == '0' ) && ( $(this).siblings('input').val() == '' || $(this).siblings('input').val() == '0' ) )
			$('input[type=checkbox]',parent).prop('checked', false);
		calcDenisty( $(this).val(), density, direction, genre );
	})

});
