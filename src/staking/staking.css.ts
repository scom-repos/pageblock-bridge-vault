import { Styles } from '@ijstech/components';
import Assets from '@staking/assets';
import { maxWidth, maxHeight } from '../config';

const colorVar = {
  primaryButton: 'transparent linear-gradient(90deg, #AC1D78 0%, #E04862 100%) 0% 0% no-repeat padding-box',
  primaryGradient: 'linear-gradient(255deg,#f15e61,#b52082)',
  darkBg: '#181E3E 0% 0% no-repeat padding-box',
  primaryDisabled: 'transparent linear-gradient(270deg,#351f52,#552a42) 0% 0% no-repeat padding-box !important'
}

Styles.fontFace({
  fontFamily: "Apple SD Gothic Neo",
  src: `url("${Assets.fullPath('fonts/FontsFree-Net-Apple-SD-Gothic-Neo-Bold.ttf')}") format("truetype")`,
  fontWeight: 'bold',
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Montserrat Regular",
  src: `url("${Assets.fullPath('fonts/montserrat/Montserrat-Regular.ttf')}") format("truetype")`,
  fontWeight: 'nomal',
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Montserrat Bold",
  src: `url("${Assets.fullPath('fonts/montserrat/Montserrat-Bold.ttf')}") format("truetype")`,
  fontWeight: 'bold',
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Montserrat Light",
  src: `url("${Assets.fullPath('fonts/montserrat/Montserrat-Light.ttf')}") format("truetype")`,
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Montserrat Medium",
  src: `url("${Assets.fullPath('fonts/montserrat/Montserrat-Medium.ttf')}") format("truetype")`,
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Montserrat SemiBold",
  src: `url("${Assets.fullPath('fonts/montserrat/Montserrat-SemiBold.ttf')}") format("truetype")`,
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Raleway Regular",
  src: `url("${Assets.fullPath('fonts/raleway/Raleway-Regular.ttf')}") format("truetype")`,
  fontWeight: 'nomal',
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Raleway Bold",
  src: `url("${Assets.fullPath('fonts/raleway/Raleway-Bold.ttf')}") format("truetype")`,
  fontWeight: 'bold',
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Raleway Light",
  src: `url("${Assets.fullPath('fonts/raleway/Raleway-Light.ttf')}") format("truetype")`,
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Raleway Medium",
  src: `url("${Assets.fullPath('fonts/raleway/Raleway-Medium.ttf')}") format("truetype")`,
  fontStyle: 'normal'
})

Styles.fontFace({
  fontFamily: "Raleway SemiBold",
  src: `url("${Assets.fullPath('fonts/raleway/Raleway-SemiBold.ttf')}") format("truetype")`,
  fontStyle: 'normal'
})

Styles.cssRule('.staking-component', {
  $nest: {
    'i-label': {
      fontFamily: 'Raleway Regular',
    },
    'span': {
      letterSpacing: '0.15px',
    },
    '#stakingElm': {
      background: '#0c1234',
    },
    '.i-loading-overlay': {
      background: '#0c1234',
    },
    '.overflow-inherit': {
      overflow: 'inherit',
    },
    '::selection': {
      color: '#fff',
      background: '#1890ff'
    },
    '.btn-os': {
      background: colorVar.primaryButton,
      height: 'auto !important',
      color: '#fff',
      transition: 'background .3s ease',
      fontSize: '1rem',
      fontWeight: 'bold',
      fontFamily: 'Raleway Bold',
      $nest: {
        'i-icon.loading-icon': {
          marginInline: '0.25rem',
          width: '16px !important',
          height: '16px !important',
        },
      },
    },
    '.btn-os:not(.disabled):not(.is-spinning):hover, .btn-os:not(.disabled):not(.is-spinning):focus': {
      background: colorVar.primaryGradient,
      backgroundColor: 'transparent',
      boxShadow: 'none',
      opacity: .9
    },
    '.btn-os:not(.disabled):not(.is-spinning):focus': {
      boxShadow: '0 0 0 0.2rem rgb(0 123 255 / 25%)'
    },
    '.btn-os.disabled, .btn-os.is-spinning': {
      background: colorVar.primaryDisabled,
      opacity: 1
    },
    '.dark-bg, .dark-modal > div > div': {
      background: colorVar.darkBg,
      borderRadius: 5
    },
    '.btn-transparent, .btn-transparent:not(.disabled):focus, .btn-transparent:not(.disabled):hover': {
      background: 'transparent',
      boxShadow: 'none',
      backgroundColor: 'transparent'
    },
    '.mr-0-5': {
      marginRight: '.5rem'
    },
    '.ml-0-5': {
      marginLeft: '.5rem'
    },
    '.mb-0-5': {
      marginBottom: '.5rem'
    },
    '.hidden': {
      display: 'none !important'
    },
    '.no-wrap': {
      whiteSpace: 'nowrap'
    },
    '.flex-nowrap': {
      flexWrap: 'nowrap',
    },
    '.py-1': {
      paddingTop: '1rem',
      paddingBottom: '1rem'
    },
    '.px-1': {
      paddingLeft: '1rem',
      paddingRight: '1rem'
    },
    '.align-middle': {
      alignItems: 'center'
    },
    '.staking-layout': {
      width: '100%',
      marginInline: 'auto',
      overflow: 'hidden',
    },
    'i-link': {
      display: 'flex',
      $nest: {
        '&:hover *': {
          color: '#fff',
          opacity: 0.9,
        },
      },
    },
    '.opacity-50': {
      opacity: 0.5
    },
    '.cursor-default': {
      cursor: 'default',
    },
    '.text-overflow': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '.wrapper': {
      width: '100%',
      height: '100%',
      maxWidth,
      maxHeight,
      $nest: {
        '.sticker': {
          position: 'absolute',
          top: '-8px',
          right: '-33px',
          borderInline: '50px solid transparent',
          borderBottom: '50px solid #20bf55',
          transform: 'rotate(45deg)',
          $nest: {
            '&.sold-out': {
              borderBottomColor: '#ccc',
            },
            '&.closed': {
              borderBottomColor: '#0c1234',
              $nest: {
                'i-label > *': {
                  color: '#f7d064 !important',
                },
                'i-icon': {
                  fill: '#f7d064',
                },
              }
            },
            '.sticker-text': {
              position: 'absolute',
              right: '-1.6rem',
              top: '0.75rem',
              width: '50px',
              lineHeight: '1rem',
            },
            'i-label': {
              display: 'flex',
              justifyContent: 'center',
            },
            'i-label > *': {
              color: '#3f3f42 !important',
              fontSize: '0.75rem',
            },
            'i-icon': {
              width: '14px',
              height: '14px',
              display: 'block',
              margin: 'auto',
            },
          },
        },
        '.custom-timer': {
          display: 'flex',
          $nest: {
            '.timer-value': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 4,
              paddingInline: 4,
              minWidth: 20,
              height: 20,
              fontSize: 14,
              fontFamily: 'Montserrat Regular',
            },
            '.timer-unit': {
              display: 'flex',
              alignItems: 'center',
            },
          },
        },
        '.bg-color': {
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          minHeight: '485px',
          height: '100%',
          borderRadius: '15px',
          paddingBottom: '1rem',
          position: 'relative',
        },
        '.btn-stake': {
          width: 370,
          maxWidth: '100%',
          padding: '0.625rem 0',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          borderRadius: 12,
        },
        '.no-campaign': {
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          justifyContent: 'center',
          $nest: {
            'i-label > *': {
              fontSize: '1.5rem',
              marginTop: '1rem',
            }
          }
        },
        '.slider-arrow': {
          fill: '#f15e61',
        }
      },
    },
    '.ml-auto': {
      marginLeft: 'auto',
    },
    '.mr-025': {
      marginRight: '0.25rem',
    },
    '.input-disabled': {
      opacity: 0.4,
      cursor: 'default',
      $nest: {
        '*': {
          cursor: 'default',
        }
      }
    },
    '#importFileErrModal': {
      $nest: {
        '.modal': {
          borderRadius: 12,
        },
        '.i-modal_header': {
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
          borderBottom: `2px solid #F15E61`,
          color: '#F15E61',
          fontSize: '1.25rem',
          fontWeight: 700,
        },
        '.i-modal_header > i-icon': {
          fill: `#F15E61 !important`
        },
        '#importFileErr span': {
          fontSize: '16px !important'
        }
      }
    },
    '#loadingElm.i-loading--active': {
      marginTop: '2rem',
      position: 'initial',
      $nest: {
        '#stakingElm': {
          display: 'none !important',
        },
        '.i-loading-spinner': {
          marginTop: '2rem',
        },
      },
    },
    '.connect-wallet': {
      display: 'block',
      textAlign: 'center',
      paddingTop: '1rem',
    },
  }
})
