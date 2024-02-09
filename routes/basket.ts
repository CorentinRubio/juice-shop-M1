/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { ProductModel } from '../models/product'
import { BasketModel } from '../models/basket'
import challengeUtils = require('../lib/challengeUtils')

import * as utils from '../lib/utils'
const security = require('../lib/insecurity')
const challenges = require('../data/datacache').challenges

module.exports = function retrieveBasket () {
  return (req: Request, res: Response, next: NextFunction) => {

    const id = req.params.id;
    if (req.headers.authorization != undefined && req.headers.authorization != null) {
      const token = req.headers.authorization;

      if (token != null) {
        //var payload = security.decode(token)
        var user = security.authenticatedUsers.from(req);
        const id = user.bid; // On remplace l'id envoyé en paramètres par le basketId de l'utilisateur connecté

      BasketModel.findOne({ where: { id }, include: [{ model: ProductModel, paranoid: false, as: 'Products' }] })
        .then((basket: BasketModel | null) => {
          /* jshint eqeqeq:false */
          challengeUtils.solveIf(challenges.basketAccessChallenge, () => {
            const user = security.authenticatedUsers.from(req)
            return user && id && id !== 'undefined' && id !== 'null' && id !== 'NaN' && user.bid && user.bid != id // eslint-disable-line eqeqeq
          })
          if (((basket?.Products) != null) && basket.Products.length > 0) {
            for (let i = 0; i < basket.Products.length; i++) {
              basket.Products[i].name = req.__(basket.Products[i].name)
            }
          }

          res.json(utils.queryResultToJson(basket))
        }).catch((error: Error) => {
          next(error)
        })
      }
    }
  }
}
