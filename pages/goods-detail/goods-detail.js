//index.js
//获取应用实例
const app = getApp();
const WxParse = require('../../wxParse/wxParse.js');
const WXAPI = require('apifm-wxapi')
Page({
	data: {
		autoplay: true,
		interval: 10000,
		duration: 500,
		goodsDetail: {},
		swiperCurrent: 0,
		hasMoreSelect: false,
		selectSize: "选择规格：",
		selectSizePrice: 0,
		shopNum: 0,
		hideShopPopup: true,
		buyNumber: 0,
		buyNumMin: 1,
		buyNumMax: 0,
		favicon: 0,
		selectptPrice: 0,
		propertyChildIds: "",
		propertyChildNames: "",
		canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
		shopCarInfo: {},
		shopType: "addShopCar", //购物类型，加入购物车或立即购买，默认为加入购物车
		tabArr: {
			curHdIndex: 0,
			curBdIndex: 0
		},
		wxlogin: true,
		sharecode: true,
		sharebox: true,
		title: "商品详情",
		barBg: 'red',
		color: '#ffffff',
		isHidden:true,
		token:null,
		id:null
	},

	//事件处理函数
	swiperchange: function(e) {
		this.setData({
			swiperCurrent: e.detail.current
		})
	},
	showAuth(){
		this.setData({
			isHidden:false
		})
	},
	/*
	*授权登录成功后回调
	*/
	afterAuth(e){
		this.setData({
			isHidden:true,
			token:e.detail
		})
		this.getFav(this.data.id)
	},
	onLoad: function(e) {
		const that = this;

		if (!e.id) { //扫码进入
			var scene = decodeURIComponent(e.scene);
			if (scene.length > 0 && scene != undefined) {
				var scarr = scene.split(',');
				var dilist = [];
				for (var i = 0; i < scarr.length; i++) {
					dilist.push(scarr[i].split('='))
				}
				if (dilist.length > 0) {
					var dict = {};
					for (var j = 0; j < dilist.length; j++) {
						dict[dilist[j][0]] = dilist[j][1]
					}
					var id = dict.i;
					var vid = dict.u;
					var sid = dict.s;
					that.setData({
						id: id
					})
					if (vid) {
						wx.setStorage({
							key: 'inviter_id_' + id,
							data: vid
						})
					}
					if (sid) {
						that.setData({
							share: sid
						});
					}
				}
			}
		}
		if (!e.scene) { //链接进入
			if (e.inviter_id) {
				wx.setStorage({
					key: 'inviter_id_' + e.id,
					data: e.inviter_id
				})
			}
			if (e.share) {
				that.setData({
					share: e.share
				});
			}
			that.setData({
				id: e.id
			})
		}



		if (app.globalData.iphone == true) {
			that.setData({
				iphone: 'iphone'
			})
		}
		// 获取购物车数据
		wx.getStorage({
			key: 'shopCarInfo',
			success: function(res) {
				that.setData({
					shopCarInfo: res.data,
					shopNum: res.data.shopNum
				});
			}
		})
		WXAPI.goodsDetail(that.data.id).then( res => {
			let selectSizeTemp = "";
			if (res.data.properties) {
				for (var i = 0; i < res.data.properties.length; i++) {
					selectSizeTemp = selectSizeTemp + " " + res.data.properties[i].name;
				}
				that.setData({
					hasMoreSelect: true,
					selectSize: that.data.selectSize + selectSizeTemp,
					selectSizePrice: res.data.basicInfo.minPrice,
					selectptPrice: res.data.basicInfo.pingtuanPrice
				});
			}
			that.data.goodsDetail = res.data;
			if (res.data.basicInfo.videoId) {
				that.getVideoSrc(res.data.basicInfo.videoId);
			}
			that.setData({
				goodsDetail: res.data,
				selectSizePrice: res.data.basicInfo.minPrice,
				buyNumMax: res.data.basicInfo.stores,
				buyNumber: (res.data.basicInfo.stores > 0) ? 1 : 0,
				selectptPrice: res.data.basicInfo.pingtuanPrice
			});
			WxParse.wxParse('article', 'html', res.data.content, that, 5);
		})
		this.reputation(that.data.id);
	},
	goShopCar: function() {
		wx.reLaunch({
			url: "/pages/cart/cart"
		});
	},
	toAddShopCar: function() {
		if(!this.data.token) return this.showAuth()
		this.setData({
			shopType: "addShopCar"
		})
		this.bindGuiGeTap();
	},
	tobuy: function() {
		if(!this.data.token) return this.showAuth();
		this.setData({
			shopType: "tobuy"
		});
		this.bindGuiGeTap();
	},
	/**
	 * 规格选择弹出框
	 */
	bindGuiGeTap: function() {
		this.setData({
			hideShopPopup: false
		})
	},
	/**
	 * 规格选择弹出框隐藏
	 */
	closePopupTap: function() {
		this.setData({
			hideShopPopup: true
		})
	},
	numJianTap: function() {
		if (this.data.buyNumber > this.data.buyNumMin) {
			var currentNum = this.data.buyNumber;
			currentNum--;
			this.setData({
				buyNumber: currentNum
			})
		}
	},
	numJiaTap: function() {
		if (this.data.buyNumber < this.data.buyNumMax) {
			var currentNum = this.data.buyNumber;
			currentNum++;
			this.setData({
				buyNumber: currentNum
			})
		}
	},
	/**
	 * 选择商品规格
	 * @param {Object} e
	 */
	labelItemTap: function(e) {
		var that = this;
		// 取消该分类下的子栏目所有的选中状态
		var childs = that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods;
		for (var i = 0; i < childs.length; i++) {
			that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods[i].active = false;
		}
		// 设置当前选中状态
		that.data.goodsDetail.properties[e.currentTarget.dataset.propertyindex].childsCurGoods[e.currentTarget.dataset.propertychildindex]
			.active = true;
		// 获取所有的选中规格尺寸数据
		var needSelectNum = that.data.goodsDetail.properties.length;
		var curSelectNum = 0;
		var propertyChildIds = "";
		var propertyChildNames = "";
		for (var i = 0; i < that.data.goodsDetail.properties.length; i++) {
			childs = that.data.goodsDetail.properties[i].childsCurGoods;
			for (var j = 0; j < childs.length; j++) {
				if (childs[j].active) {
					curSelectNum++;
					propertyChildIds = propertyChildIds + that.data.goodsDetail.properties[i].id + ":" + childs[j].id + ",";
					propertyChildNames = propertyChildNames + that.data.goodsDetail.properties[i].name + ":" + childs[j].name +
						"  ";
				}
			}
		}
		var canSubmit = false;
		if (needSelectNum == curSelectNum) {
			canSubmit = true;
		}
		// 计算当前价格
		if (canSubmit) {
			WXAPI.goodsPrice(that.data.goodsDetail.basicInfo.id, propertyChildIds).then(res => {
				that.setData({
					selectSizePrice: res.data.price,
					propertyChildIds: propertyChildIds,
					propertyChildNames: propertyChildNames,
					buyNumMax: res.data.stores,
					buyNumber: (res.data.stores > 0) ? 1 : 0,
					selectptPrice: res.data.pingtuanPrice
				});
			})
		}

		this.setData({
			goodsDetail: that.data.goodsDetail,
			canSubmit: canSubmit
		})

	},
	/**
	 * 加入购物车
	 */
	addShopCar: function() {
		if(!this.data.token) return this.showAuth()
		if (this.data.goodsDetail.properties && !this.data.canSubmit) {
			if (!this.data.canSubmit) {
				wx.showModal({
					title: '提示',
					content: '请选择商品规格！',
					showCancel: false
				})
			}
			this.bindGuiGeTap();
			return;
		}
		if (this.data.buyNumber < 1) {
			wx.showModal({
				title: '提示',
				content: '购买数量不能为0！',
				showCancel: false
			})
			return;
		}
		//组建购物车
		var shopCarInfo = this.bulidShopCarInfo();

		this.setData({
			shopCarInfo: shopCarInfo,
			shopNum: shopCarInfo.shopNum
		});
		// 写入本地存储
		wx.setStorage({
			key: "shopCarInfo",
			data: shopCarInfo
		})
		//更新tabar购物车数字角标
		app.getShopCartNum()
		this.closePopupTap();
		wx.showToast({
			title: '加入购物车成功',
			icon: 'success',
			duration: 2000
		})
		//console.log(shopCarInfo);

		//shopCarInfo = {shopNum:12,shopList:[]}
	},
	/**
	 * 立即购买
	 */
	buyNow: function() {
		if(!this.data.token) return this.showAuth()
		const that = this;
		if (that.data.goodsDetail.properties && !that.data.canSubmit) {
			wx.hideLoading();
			if (!that.data.canSubmit) {
				wx.showModal({
					title: '提示',
					content: '请选择商品规格！',
					showCancel: false
				})
			}
			that.bindGuiGeTap();
			wx.showModal({
				title: '提示',
				content: '请先选择规格尺寸哦~',
				showCancel: false
			})
			return;
		}
		if (that.data.buyNumber < 1) {
			wx.hideLoading();
			wx.showModal({
				title: '提示',
				content: '购买数量不能为0！',
				showCancel: false
			})
			return;
		}
		setTimeout(function() {
			wx.hideLoading();
			//组建立即购买信息
			var buyNowInfo = that.buliduBuyNowInfo();
			// 写入本地存储
			wx.setStorage({
				key: "buyNowInfo",
				data: buyNowInfo
			})
			that.closePopupTap();

			wx.navigateTo({
				url: "/pages/pay-order/pay-order?orderType=buyNow"
			})
		}, 1000);
		wx.showLoading({
			title: '商品准备中...',
		})

	},
	/**
	 * 组建购物车信息
	 */
	bulidShopCarInfo: function() {
		// 加入购物车
		var shopCarMap = {};
		shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
		shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
		shopCarMap.name = this.data.goodsDetail.basicInfo.name;
		// shopCarMap.label=this.data.goodsDetail.basicInfo.id; 规格尺寸 
		shopCarMap.propertyChildIds = this.data.propertyChildIds;
		shopCarMap.label = this.data.propertyChildNames;
		shopCarMap.price = this.data.selectSizePrice;
		shopCarMap.left = "";
		shopCarMap.active = true;
		shopCarMap.number = this.data.buyNumber;
		shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
		shopCarMap.logistics = this.data.goodsDetail.logistics;
		shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

		var shopCarInfo = this.data.shopCarInfo;
		if (!shopCarInfo.shopNum) {
			shopCarInfo.shopNum = 0;
		}
		if (!shopCarInfo.shopList) {
			shopCarInfo.shopList = [];
		}
		var hasSameGoodsIndex = -1;
		for (var i = 0; i < shopCarInfo.shopList.length; i++) {
			var tmpShopCarMap = shopCarInfo.shopList[i];
			if (tmpShopCarMap.goodsId == shopCarMap.goodsId && tmpShopCarMap.propertyChildIds == shopCarMap.propertyChildIds) {
				hasSameGoodsIndex = i;
				shopCarMap.number = shopCarMap.number + tmpShopCarMap.number;
				break;
			}
		}

		shopCarInfo.shopNum = shopCarInfo.shopNum + this.data.buyNumber;
		if (hasSameGoodsIndex > -1) {
			shopCarInfo.shopList.splice(hasSameGoodsIndex, 1, shopCarMap);
		} else {
			shopCarInfo.shopList.push(shopCarMap);
		}
		return shopCarInfo;
	},
	/**
	 * 组建立即购买信息
	 */
	buliduBuyNowInfo: function() {
		var shopCarMap = {};
		shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
		shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
		shopCarMap.name = this.data.goodsDetail.basicInfo.name;
		// shopCarMap.label=this.data.goodsDetail.basicInfo.id; 规格尺寸 
		shopCarMap.propertyChildIds = this.data.propertyChildIds;
		shopCarMap.label = this.data.propertyChildNames;
		shopCarMap.price = this.data.selectSizePrice;
		shopCarMap.left = "";
		shopCarMap.active = true;
		shopCarMap.number = this.data.buyNumber;
		shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
		shopCarMap.logistics = this.data.goodsDetail.logistics;
		shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

		var buyNowInfo = {};
		if (!buyNowInfo.shopNum) {
			buyNowInfo.shopNum = 0;
		}
		if (!buyNowInfo.shopList) {
			buyNowInfo.shopList = [];
		}
		buyNowInfo.shopList.push(shopCarMap);
		return buyNowInfo;
	},
	bulidupingTuanInfo: function() {
		var shopCarMap = {};
		shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
		shopCarMap.pingtuanId = this.data.pingtuanOpenId;
		shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
		shopCarMap.name = this.data.goodsDetail.basicInfo.name;
		// shopCarMap.label=this.data.goodsDetail.basicInfo.id; 规格尺寸 
		shopCarMap.propertyChildIds = this.data.propertyChildIds;
		shopCarMap.label = this.data.propertyChildNames;
		shopCarMap.price = this.data.selectptPrice;
		//this.data.goodsDetail.basicInfo.pingtuanPrice;
		shopCarMap.left = "";
		shopCarMap.active = true;
		shopCarMap.number = this.data.buyNumber;
		shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
		shopCarMap.logistics = this.data.goodsDetail.logistics;
		shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

		var buyNowInfo = {};
		if (!buyNowInfo.shopNum) {
			buyNowInfo.shopNum = 0;
		}
		if (!buyNowInfo.shopList) {
			buyNowInfo.shopList = [];
		}
		buyNowInfo.shopList.push(shopCarMap);
		return buyNowInfo;
	},
	onShareAppMessage: function() {
		var that = this;
		that.setData({
			sharebox: true
		})
		return {
			title: this.data.goodsDetail.basicInfo.name,
			path: '/pages/goods-detail/goods-detail?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + app.globalData
				.uid + '&share=1',
			success: function(res) {
				// 转发成功
			},
			fail: function(res) {
				// 转发失败
			}
		}
	},
	reputation(goodsId) {
		WXAPI.goodsReputation({
			goodsId: goodsId
		}).then(res => {
			if (res.code == 0) {
				this.setData({
					reputation: res.data
				});
			}
		})
	},
	getFav(goodsId) {
		console.log('run')
		WXAPI.goodsFavCheck(this.data.token, goodsId).then( res => {
			console.log(res)
			if(res.code == 0){
				this.setData({
					favicon: 1
				})
			}
		})
	},
	fav: function() {
		if(!this.data.token) return this.showAuth()
		const that = this;
		WXAPI.goodsFavPut(this.data.token,this.data.goodsDetail.basicInfo.id).then( res => {
			if (res.code == 0) {
				wx.showToast({
					title: '收藏成功',
					icon: 'success',
					image: '../../images/active.png',
					duration: 2000
				})
				that.setData({
					favicon: 1
				});
			}
		})
	},
	del: function() {
		WXAPI.goodsFavDelete(this.data.token,'',this.data.goodsDetail.basicInfo.id).then( res => {
			if (res.code == 0) {
				wx.showToast({
					title: '取消收藏',
					icon: 'success',
					image: '../../images/error.png',
					duration: 2000
				})
				this.setData({
					favicon: 0
				});
			}
		})
	},
	getVideoSrc: function(videoId) {
		var that = this;
		// wx.request({
		// 	url: app.globalData.urls + '/media/video/detail',
		// 	data: {
		// 		videoId: videoId
		// 	},
		// 	success: function(res) {
		// 		if (res.data.code == 0) {
		// 			that.setData({
		// 				videoMp4Src: res.data.data.fdMp4
		// 			});
		// 		}
		// 	}
		// })
	},
	gohome: function() {
		wx.switchTab({
			url: "/pages/index/index"
		})
	},
	tabFun: function(e) {
		var _datasetId = e.target.dataset.id;
		var _obj = {};
		_obj.curHdIndex = _datasetId;
		_obj.curBdIndex = _datasetId;
		this.setData({
			tabArr: _obj
		});
	},
	addPingTuan: function(e) {
		var id = e.currentTarget.dataset.id;
		var pid = e.currentTarget.dataset.uid;
		wx.navigateTo({
			url: "/pages/pingtuan/index?id=" + id + "&uid=" + pid + "&gid=" + this.data.goodsDetail.basicInfo.id
		})
	},
	goPingtuanTap: function() {
		wx.navigateTo({
			url: "/pages/pingtuan/index?id=" + this.data.ptuanCt + "&uid=" + app.globalData.uid + "&gid=" + this.data.goodsDetail
				.basicInfo.id
		})
	},
	onPullDownRefresh: function(e) {
		wx.stopPullDownRefresh();
	},
	onShow: function() {
		
	},
	getShareBox: function() {
		this.setData({
			sharebox: false
		})
	},
	getcode: function() {
		var that = this;
		wx.showLoading({
			title: '生成中...',
		})
		WXAPI.wxaQrcode({
			scene: "i=" + that.data.goodsDetail.basicInfo.id + ",u=" + app.globalData.uid + ",s=1",
			page: "pages/goods-detail/goods-detail",
			expireHours: 1
		}).then( res => {
			if (res.code == 0) {
				wx.downloadFile({
					url: res.data,
					success: function(res) {
						wx.hideLoading()
						that.setData({
							codeimg: res.tempFilePath,
							sharecode: false,
							sharebox: true
						});
					}
				})
			}
		})
	},
	savecode: function() {
		var that = this;
		wx.saveImageToPhotosAlbum({
			filePath: that.data.codeimg,
			success(res) {
				wx.showToast({
					title: '保存成功',
					icon: 'success',
					duration: 2000
				})
			}
		})
		that.setData({
			sharecode: true,
		})
	},
	closeshare: function() {
		this.setData({
			sharebox: true,
			sharecode: true
		})
	},
})
